"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ACADEMIC_INTEGRITY_ATTESTATION, isPostableType, POST_LIMITS } from "@/lib/content-policy";
import { isValidSemester } from "@/lib/semesters";
import { createClient } from "@/lib/supabase/server";

// Every mutation here requires a signed-in user. Row Level Security in the
// database enforces ownership again, so these checks are for clear errors,
// not the only line of defense.

type ActionResult = { ok: true } | { ok: false; error: string };

const SIGN_IN_REQUIRED: ActionResult = { ok: false, error: "Sign in to do that." };
const UNIQUE_VIOLATION = "23505";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Upvote a post, or remove the upvote if it's already there.
export async function toggleVote(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("votes").delete().eq("id", existing.id)
    : await supabase.from("votes").insert({ post_id: postId, user_id: user.id, value: 1 });

  // A double click can race: the unique constraint keeps it to one vote.
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { ok: false, error: "Couldn't save your vote. Try again." };
  }
  refresh();
  return { ok: true };
}

export async function toggleBookmark(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)
    : await supabase.from("bookmarks").insert({ post_id: postId, user_id: user.id });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { ok: false, error: "Couldn't update your saved posts. Try again." };
  }
  refresh();
  return { ok: true };
}

export async function toggleMembership(courseId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("course_members")
    .select("user_id")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("course_members").delete().eq("course_id", courseId).eq("user_id", user.id)
    : await supabase.from("course_members").insert({ course_id: courseId, user_id: user.id });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { ok: false, error: "Couldn't update your membership. Try again." };
  }
  refresh();
  return { ok: true };
}

export type CommentFormState = { error?: string; success?: number } | undefined;

export async function createComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to comment." };

  const postId = text(formData, "postId");
  const parentId = text(formData, "parentId") || null;
  const content = text(formData, "content");
  if (!content) return { error: "Write something first." };
  if (content.length > POST_LIMITS.commentMax) {
    return { error: `Comments can be at most ${POST_LIMITS.commentMax} characters.` };
  }

  const supabase = await createClient();

  // Threads are two levels deep: a reply to a reply attaches to the top-level
  // comment. The parent must belong to the same post.
  let parentCommentId: string | null = null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id, post_id, parent_comment_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.post_id !== postId) return { error: "That comment no longer exists." };
    parentCommentId = parent.parent_comment_id ?? parent.id;
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    parent_comment_id: parentCommentId,
    content,
  });
  if (error) return { error: "Couldn't post your comment. Try again." };

  refresh();
  return { success: Date.now() };
}

export type PostFormValues = {
  courseId: string;
  type: string;
  title: string;
  content: string;
  semester: string;
  topicIds: string[];
  integrity: boolean;
};

export type PostFormState =
  | {
      errors: Partial<Record<keyof PostFormValues | "form", string>>;
      values: PostFormValues;
      // Changes on every response so the form can remount with these values.
      attempt: number;
    }
  | undefined;

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const values: PostFormValues = {
    courseId: text(formData, "courseId"),
    type: text(formData, "type"),
    title: text(formData, "title"),
    content: text(formData, "content"),
    semester: text(formData, "semester"),
    topicIds: formData.getAll("topicIds").filter((v): v is string => typeof v === "string"),
    integrity: formData.get("integrity") === "on",
  };

  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Sign in to publish a post." }, values, attempt: Date.now() };

  const errors: NonNullable<PostFormState>["errors"] = {};
  if (!isPostableType(values.type)) errors.type = "Choose a post type.";
  if (values.title.length < POST_LIMITS.titleMin) {
    errors.title = `Titles need at least ${POST_LIMITS.titleMin} characters.`;
  } else if (values.title.length > POST_LIMITS.titleMax) {
    errors.title = `Titles can be at most ${POST_LIMITS.titleMax} characters.`;
  }
  if (values.content.length < POST_LIMITS.contentMin) {
    errors.content = `Write at least ${POST_LIMITS.contentMin} characters.`;
  } else if (values.content.length > POST_LIMITS.contentMax) {
    errors.content = `Posts can be at most ${POST_LIMITS.contentMax.toLocaleString()} characters.`;
  }
  if (!isValidSemester(values.semester)) errors.semester = "Choose the semester you took the course.";
  if (values.topicIds.length > POST_LIMITS.maxTopics) {
    errors.topicIds = `Pick at most ${POST_LIMITS.maxTopics} topics.`;
  }
  if (!values.integrity) {
    errors.integrity = `You must confirm: "${ACADEMIC_INTEGRITY_ATTESTATION}"`;
  }

  const supabase = await createClient();
  const { data: course } = values.courseId
    ? await supabase
        .from("courses")
        .select("id, slug, topics(id)")
        .eq("id", values.courseId)
        .maybeSingle<{ id: string; slug: string; topics: { id: string }[] }>()
    : { data: null };
  if (!course) {
    errors.courseId = "Choose a course.";
  } else {
    const courseTopicIds = new Set(course.topics.map((t) => t.id));
    if (values.topicIds.some((id) => !courseTopicIds.has(id))) {
      errors.topicIds = "Pick topics from this course.";
    }
  }

  if (Object.keys(errors).length > 0 || !course || !isPostableType(values.type)) {
    return { errors, values, attempt: Date.now() };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      course_id: course.id,
      author_id: user.id,
      type: values.type,
      title: values.title,
      content: values.content,
      semester: values.semester,
      integrity_attested_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !post) {
    return { errors: { form: "Couldn't publish your post. Try again." }, values, attempt: Date.now() };
  }

  if (values.topicIds.length > 0) {
    const { error: topicError } = await supabase
      .from("post_topics")
      .insert(values.topicIds.map((topicId) => ({ post_id: post.id, topic_id: topicId })));
    if (topicError) {
      // Don't leave a half-created post behind.
      await supabase.from("posts").delete().eq("id", post.id);
      return {
        errors: { form: "Couldn't save the post's topics. Try again." },
        values,
        attempt: Date.now(),
      };
    }
  }

  redirect(`/c/${course.slug}/posts/${post.id}`);
}

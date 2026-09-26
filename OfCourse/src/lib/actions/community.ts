"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { queuePostEmbedding } from "@/lib/ai/index-posts";
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

// Vote on a post. Voting the same way again removes the vote; voting the
// other way switches it. The database keeps one vote per student per post.
export async function castVote(postId: string, value: 1 | -1): Promise<ActionResult> {
  if (value !== 1 && value !== -1) return { ok: false, error: "Invalid vote." };
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = !existing
    ? await supabase.from("votes").insert({ post_id: postId, user_id: user.id, value })
    : existing.value === value
      ? await supabase.from("votes").delete().eq("id", existing.id)
      : await supabase.from("votes").update({ value }).eq("id", existing.id);

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

function readPostForm(formData: FormData): PostFormValues {
  return {
    courseId: text(formData, "courseId"),
    type: text(formData, "type"),
    title: text(formData, "title"),
    content: text(formData, "content"),
    semester: text(formData, "semester"),
    topicIds: formData.getAll("topicIds").filter((v): v is string => typeof v === "string"),
    integrity: formData.get("integrity") === "on",
  };
}

// Validation shared by creating and editing a post. Returns the course when
// everything is valid.
async function validatePost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: PostFormValues,
) {
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

  const valid = Object.keys(errors).length === 0 && course && isPostableType(values.type);
  return { errors, course: valid ? course : null };
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const values = readPostForm(formData);
  const fail = (errors: NonNullable<PostFormState>["errors"]) => ({ errors, values, attempt: Date.now() });

  const user = await getCurrentUser();
  if (!user) return fail({ form: "Sign in to publish a post." });

  const supabase = await createClient();
  const { errors, course } = await validatePost(supabase, values);
  if (!course || !isPostableType(values.type)) return fail(errors);

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
  if (error || !post) return fail({ form: "Couldn't publish your post. Try again." });

  if (values.topicIds.length > 0) {
    const { error: topicError } = await supabase
      .from("post_topics")
      .insert(values.topicIds.map((topicId) => ({ post_id: post.id, topic_id: topicId })));
    if (topicError) {
      // Don't leave a half-created post behind.
      await supabase.from("posts").delete().eq("id", post.id);
      return fail({ form: "Couldn't save the post's topics. Try again." });
    }
  }

  queuePostEmbedding(post.id);
  redirect(`/c/${course.slug}/posts/${post.id}`);
}

// Edit your own post. The course can't change; the author re-confirms
// academic integrity, which updates integrity_attested_at.
export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const values = readPostForm(formData);
  const postId = text(formData, "postId");
  const fail = (errors: NonNullable<PostFormState>["errors"]) => ({ errors, values, attempt: Date.now() });

  const user = await getCurrentUser();
  if (!user) return fail({ form: "Sign in to edit your post." });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("posts")
    .select("id, author_id, course_id")
    .eq("id", postId)
    .maybeSingle();
  if (!existing || existing.author_id !== user.id) return fail({ form: "You can only edit your own posts." });
  values.courseId = existing.course_id;

  const { errors, course } = await validatePost(supabase, values);
  if (!course || !isPostableType(values.type)) return fail(errors);

  const { error } = await supabase
    .from("posts")
    .update({
      type: values.type,
      title: values.title,
      content: values.content,
      semester: values.semester,
      integrity_attested_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) return fail({ form: "Couldn't save your changes. Try again." });

  // Replace the topic tags.
  const { error: clearError } = await supabase.from("post_topics").delete().eq("post_id", postId);
  const { error: topicError } =
    !clearError && values.topicIds.length > 0
      ? await supabase
          .from("post_topics")
          .insert(values.topicIds.map((topicId) => ({ post_id: postId, topic_id: topicId })))
      : { error: clearError };
  queuePostEmbedding(postId);
  if (topicError) return fail({ form: "Your post was saved, but its topics couldn't be updated." });

  redirect(`/c/${course.slug}/posts/${postId}`);
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id, course:courses(slug)")
    .eq("id", postId)
    .maybeSingle<{ author_id: string; course: { slug: string } }>();
  if (!post || post.author_id !== user.id) return { ok: false, error: "You can only delete your own posts." };

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { ok: false, error: "Couldn't delete the post. Try again." };
  redirect(`/c/${post.course.slug}`);
}

export async function updateComment(commentId: string, content: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Write something first." };
  if (trimmed.length > POST_LIMITS.commentMax) {
    return { ok: false, error: `Comments can be at most ${POST_LIMITS.commentMax} characters.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", commentId)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .select("id");
  if (error || !data?.length) return { ok: false, error: "Couldn't save your comment." };
  refresh();
  return { ok: true };
}

// A comment with replies is soft-deleted so the thread stays readable;
// otherwise it's removed.
export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();

  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("parent_comment_id", commentId);

  const { data, error } = count
    ? await supabase
        .from("comments")
        .update({ content: "[deleted]", deleted_at: new Date().toISOString() })
        .eq("id", commentId)
        .eq("author_id", user.id)
        .select("id")
    : await supabase.from("comments").delete().eq("id", commentId).eq("author_id", user.id).select("id");
  if (error || !data?.length) return { ok: false, error: "Couldn't delete the comment." };
  refresh();
  return { ok: true };
}

export type RatingFormState = { error?: string; saved?: boolean; attempt: number } | undefined;

// Rate a course (or update your rating). Only averages are ever shown publicly.
export async function rateCourse(_prev: RatingFormState, formData: FormData): Promise<RatingFormState> {
  const reply = (rest: { error?: string; saved?: boolean }) => ({ ...rest, attempt: Date.now() });
  const user = await getCurrentUser();
  if (!user) return reply({ error: "Sign in to rate this course." });

  const courseId = text(formData, "courseId");
  const workload = Number(text(formData, "workloadHours"));
  const difficulty = Number(text(formData, "difficulty"));
  const again = text(formData, "wouldTakeAgain");
  const semester = text(formData, "semester");

  if (!Number.isInteger(workload) || workload < 0 || workload > 60) {
    return reply({ error: "Enter your weekly hours (0–60)." });
  }
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    return reply({ error: "Choose a difficulty from 1 to 10." });
  }
  if (again !== "yes" && again !== "no") return reply({ error: "Would you take it again?" });
  if (semester && !isValidSemester(semester)) return reply({ error: "Choose a valid semester." });

  const supabase = await createClient();
  const rating = {
    workload_hours: workload,
    difficulty,
    would_take_again: again === "yes",
    semester: semester || null,
  };
  const { data: existing } = await supabase
    .from("course_ratings")
    .select("course_id")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("course_ratings").update(rating).eq("course_id", courseId).eq("user_id", user.id)
    : await supabase.from("course_ratings").insert({ ...rating, course_id: courseId, user_id: user.id });
  if (error) return reply({ error: "Couldn't save your rating. Try again." });

  refresh();
  return reply({ saved: true });
}

export async function removeRating(courseId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGN_IN_REQUIRED;
  const supabase = await createClient();
  const { error } = await supabase
    .from("course_ratings")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Couldn't remove your rating." };
  refresh();
  return { ok: true };
}

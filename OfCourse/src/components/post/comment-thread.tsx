"use client";

import { MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";

import { CommentForm } from "@/components/post/comment-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authorName, UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import { deleteComment, updateComment } from "@/lib/actions/community";
import { POST_LIMITS } from "@/lib/content-policy";
import type { CommentNode } from "@/lib/data/posts";
import { timeAgo } from "@/lib/format";
import { profileHref } from "@/lib/links";

const actionClass =
  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

function CommentBody({
  comment,
  viewerId,
  children,
}: {
  comment: CommentNode;
  viewerId?: string;
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isOwn = Boolean(viewerId) && comment.author?.id === viewerId;

  if (comment.deleted) {
    return (
      <>
        <p className="text-sm text-muted-foreground italic">Comment deleted</p>
        {children}
      </>
    );
  }

  const save = () =>
    startTransition(async () => {
      const result = await updateComment(comment.id, draft);
      if (result.ok) {
        setEditing(false);
        setError(null);
      } else setError(result.error);
    });

  const remove = () => {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {comment.author ? (
          <Link
            href={profileHref(comment.author)}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <UserAvatar author={comment.author} className="size-6" />
            {authorName(comment.author)}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 font-medium">
            <UserAvatar author={null} className="size-6" />
            {authorName(null)}
          </span>
        )}
        {comment.author?.university && <VerifiedBadge university={comment.author.university} />}
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        <time dateTime={comment.createdAt} className="text-muted-foreground">
          {timeAgo(comment.createdAt)}
        </time>
        {comment.edited && <span className="text-muted-foreground">· edited</span>}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2 pl-8">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={POST_LIMITS.commentMax}
            aria-label="Edit comment"
            className="min-h-20 bg-card"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setDraft(comment.content);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={pending || !draft.trim()}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 pl-8 text-sm whitespace-pre-line">{comment.content}</p>
      )}

      {error && (
        <p className="pl-8 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {(children || (isOwn && !editing)) && (
        <div className="mt-1 flex items-center gap-1 pl-6">
          {children}
          {isOwn && !editing && (
            <>
              <button
                type="button"
                className={actionClass}
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button type="button" className={actionClass} onClick={remove} disabled={pending}>
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function TopLevelComment({
  comment,
  postId,
  signedIn,
  viewerId,
}: {
  comment: CommentNode;
  postId: string;
  signedIn: boolean;
  viewerId?: string;
}) {
  const [replying, setReplying] = useState(false);
  const closeReply = useCallback(() => setReplying(false), []);

  return (
    <li className="flex flex-col gap-2">
      <CommentBody comment={comment} viewerId={viewerId}>
        {!comment.deleted && !replying && (
          <button type="button" onClick={() => setReplying(true)} className={actionClass}>
            <MessageSquareReply className="size-3.5" />
            Reply
          </button>
        )}
      </CommentBody>

      {replying && (
        <div className="pl-8">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            signedIn={signedIn}
            placeholder={`Reply to ${authorName(comment.author)}`}
            autoFocus
            onDone={closeReply}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="ml-3 flex flex-col gap-4 border-l-2 pl-5">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentBody comment={reply} viewerId={viewerId} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({
  comments,
  postId,
  signedIn,
  viewerId,
}: {
  comments: CommentNode[];
  postId: string;
  signedIn: boolean;
  viewerId?: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No comments yet. Start the conversation.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-6">
      {comments.map((comment) => (
        <TopLevelComment
          key={comment.id}
          comment={comment}
          postId={postId}
          signedIn={signedIn}
          viewerId={viewerId}
        />
      ))}
    </ul>
  );
}

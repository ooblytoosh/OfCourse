"use client";

import { MessageSquareReply } from "lucide-react";
import { useCallback, useState } from "react";

import { CommentForm } from "@/components/post/comment-form";
import { authorName, UserAvatar } from "@/components/user-avatar";
import type { CommentNode } from "@/lib/data/posts";
import { timeAgo } from "@/lib/format";

function CommentBody({ comment }: { comment: CommentNode }) {
  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <UserAvatar author={comment.author} className="size-6" />
        <span className="font-medium">{authorName(comment.author)}</span>
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        <time dateTime={comment.createdAt} className="text-muted-foreground">
          {timeAgo(comment.createdAt)}
        </time>
      </div>
      <p className="mt-1.5 pl-8 text-sm whitespace-pre-line">{comment.content}</p>
    </>
  );
}

function TopLevelComment({
  comment,
  postId,
  signedIn,
}: {
  comment: CommentNode;
  postId: string;
  signedIn: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const closeReply = useCallback(() => setReplying(false), []);

  return (
    <li className="flex flex-col gap-2">
      <CommentBody comment={comment} />
      <div className="pl-6">
        {replying ? (
          <div className="pl-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              signedIn={signedIn}
              placeholder={`Reply to ${authorName(comment.author)}`}
              autoFocus
              onDone={closeReply}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MessageSquareReply className="size-3.5" />
            Reply
          </button>
        )}
      </div>

      {comment.replies.length > 0 && (
        <ul className="ml-3 flex flex-col gap-4 border-l-2 pl-5">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentBody comment={reply} />
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
}: {
  comments: CommentNode[];
  postId: string;
  signedIn: boolean;
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
        <TopLevelComment key={comment.id} comment={comment} postId={postId} signedIn={signedIn} />
      ))}
    </ul>
  );
}

import React, { useState } from "react";
import { ArrowBigUp, BookOpen, Calendar } from "lucide-react";

const NAVY = "#003057";
const GOLD = "#B3A369";
const INK = "#1A1A1A";
const SLATE = "#5B6770";
const RULE = "#E3E0D6";
const PAGE_BG = "#F4F1EA";
const READABLE_WIDTH = 680; // caps paragraph line length even in a wide layout

const defaultPosts = [
  {
    id: 1,
    course: "CS 3600",
    title: "AI is a beast — start the projects early",
    termTaken: "Fall 2025",
    upvotes: 27,
    downvotes: 3,
    time: "2 days ago",
  },
  {
    id: 2,
    course: "MATH 2551",
    title: "Chen's morning sections move fast but office hours save you",
    termTaken: "Spring 2025",
    upvotes: 14,
    downvotes: 2,
    time: "1 week ago",
  },
  {
    id: 3,
    course: "PHYS 2211",
    title: "Labs run long — budget three hours, not two",
    termTaken: "Fall 2024",
    upvotes: 10,
    downvotes: 2,
    time: "3 weeks ago",
  },
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentProfile({
  name = "Priya Natarajan",
  major = "Computer Science",
  classYear = "2027",
  bio = "CS 4641 was rough but worth it. Ask me about AI electives.",
  stats = { reviews: 47, followers: 128 },
  posts = defaultPosts,
}) {
  const [userUpvoted, setUserUpvoted] = useState({});
  const [hoveredId, setHoveredId] = useState(null);

  const toggleUpvote = (id) => {
    setUserUpvoted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const netVotes = (post) =>
    post.upvotes - post.downvotes + (userUpvoted[post.id] ? 1 : 0);

  const totalHelpful = posts.reduce((sum, post) => sum + netVotes(post), 0);

  return (
    // Full-viewport wrapper: fills the screen in both directions and centers the card
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(12px, 4vw, 32px)",
        background: PAGE_BG,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          maxHeight: "100%",
          overflowY: "auto",
          boxSizing: "border-box",
          background: "#FFFFFF",
          border: `1px solid ${RULE}`,
          color: INK,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: NAVY,
            color: "#FFFFFF",
            padding: "22px clamp(20px, 4vw, 40px)",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 0.3 }}>
            Ramblin Reviews
          </span>
          <button
            style={{
              background: "transparent",
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontSize: 18,
              padding: "8px 22px",
              cursor: "pointer",
            }}
          >
            Follow
          </button>
        </div>

        <div
          style={{
            padding: "clamp(20px, 4vw, 40px)",
            boxSizing: "border-box",
          }}
        >
          {/* Identity row */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div
              style={{
                width: 84,
                height: 84,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: GOLD,
                color: NAVY,
                fontSize: 28,
                fontWeight: 600,
              }}
            >
              {initials(name)}
            </div>
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <h2 style={{ fontSize: 38, margin: 0, lineHeight: 1.2, color: INK }}>
                {name}
              </h2>
              <p style={{ fontSize: 20, color: SLATE, margin: "8px 0 0" }}>
                {major} &middot; Class of {classYear}
              </p>
              <p
                style={{
                  fontSize: 20,
                  color: SLATE,
                  fontStyle: "italic",
                  margin: "12px 0 0",
                  maxWidth: READABLE_WIDTH,
                }}
              >
                {bio}
              </p>
            </div>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: "flex",
              marginTop: 36,
              borderTop: `1px solid ${RULE}`,
              borderBottom: `1px solid ${RULE}`,
            }}
          >
            <Stat value={stats.reviews} label="Reviews written" />
            <Stat value={totalHelpful} label="Helpful votes" border />
            <Stat value={stats.followers} label="Followers" border />
          </div>

          {/* Recent posts */}
          <div style={{ marginTop: 36, textAlign: "left" }}>
            <h3 style={{ fontSize: 26, margin: "0 0 18px", color: INK }}>
              Recent posts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {posts.map((post) => {
                const isUpvoted = !!userUpvoted[post.id];
                const isHovered = hoveredId === post.id;
                const arrowFilled = isUpvoted || isHovered;

                return (
                  <div
                    key={post.id}
                    style={{
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                      padding: 22,
                      boxSizing: "border-box",
                      border: `1px solid ${RULE}`,
                    }}
                  >
                    <button
                      onClick={() => toggleUpvote(post.id)}
                      onMouseEnter={() => setHoveredId(post.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      aria-pressed={isUpvoted}
                      aria-label="Toggle upvote"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 44,
                        flexShrink: 0,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <ArrowBigUp
                        size={28}
                        strokeWidth={1.75}
                        color={GOLD}
                        fill={arrowFilled ? GOLD : "none"}
                      />
                      <span style={{ fontSize: 16, color: SLATE, marginTop: 2 }}>
                        {netVotes(post)}
                      </span>
                    </button>
                    <div style={{ minWidth: 0, textAlign: "left" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 18,
                        }}
                      >
                        <BookOpen size={20} color={NAVY} />
                        <span style={{ fontWeight: 600, color: NAVY }}>
                          {post.course}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 20,
                          margin: "6px 0 0",
                          color: INK,
                          maxWidth: READABLE_WIDTH,
                        }}
                      >
                        {post.title}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
                        <Calendar size={16} color={SLATE} />
                        <span style={{ fontSize: 16, color: SLATE }}>
                          Took the course {post.termTaken}
                        </span>
                      </div>
                      <p style={{ fontSize: 16, color: SLATE, margin: "5px 0 0" }}>
                        Posted {post.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, border }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 16px",
        boxSizing: "border-box",
        textAlign: "center",
        borderLeft: border ? `1px solid ${RULE}` : "none",
      }}
    >
      <div style={{ fontSize: 34, color: NAVY, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 16, color: SLATE, marginTop: 6 }}>{label}</div>
    </div>
  );
}
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { RUBRIC_URL, type FeedbackComment, type FeedbackDocument, type FeedbackQuestion, type FeedbackRound } from "./types";

const navy = "#00274C";
const maize = "#FFCB05";
const ink = "#1E1E1E";
const muted = "#5A6570";
const line = "#D5DCE3";
const paper = "#F4F7FA";

const styles = StyleSheet.create({
  page: {
    // Do not set lineHeight on Page — it breaks fixed footer Text with render().
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 46,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: ink,
  },
  coverBar: {
    backgroundColor: navy,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  brand: {
    color: maize,
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  project: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  summary: {
    color: "#D7E2EE",
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaChip: {
    backgroundColor: "#013B71",
    color: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginRight: 8,
    marginBottom: 6,
  },
  rubric: {
    color: muted,
    fontSize: 9,
    marginBottom: 10,
  },
  warning: {
    color: muted,
    fontSize: 9,
    marginBottom: 10,
  },
  round: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionRule: {
    height: 3,
    width: 42,
    backgroundColor: maize,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: navy,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionMeta: {
    color: muted,
    fontSize: 9,
    marginBottom: 10,
  },
  question: {
    marginTop: 4,
    marginBottom: 12,
  },
  questionHead: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: line,
  },
  questionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: navy,
    marginBottom: 2,
  },
  questionStats: {
    fontSize: 9,
    color: muted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  chip: {
    backgroundColor: paper,
    borderWidth: 1,
    borderColor: line,
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontSize: 8,
    color: navy,
    marginRight: 6,
    marginBottom: 6,
  },
  card: {
    backgroundColor: paper,
    borderLeftWidth: 3,
    borderLeftColor: maize,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  cardJudge: {
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  cardText: {
    fontSize: 10,
    color: ink,
    lineHeight: 1.5,
  },
  empty: {
    color: muted,
    fontSize: 9,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: navy,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyBody: {
    color: muted,
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  footer: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 24,
    color: muted,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
});

export function FeedbackPdfDocument({ doc }: { doc: FeedbackDocument }) {
  return (
    <Document
      title={`Fuel Application Review - Judge's Feedback for ${doc.projectName}`}
      author="Center for Entrepreneurship"
      subject="Fuel judge feedback"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `University of Michigan · CFE Fuel · Confidential judge feedback · ${pageNumber} / ${totalPages}`
          }
        />

        <View style={styles.coverBar} wrap={false}>
          <Text style={styles.brand}>Center for Entrepreneurship · Fuel</Text>
          <Text style={styles.title}>{"Judge's Feedback"}</Text>
          <Text style={styles.project}>{doc.projectName}</Text>
          {doc.summary ? <Text style={styles.summary}>{doc.summary}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>
              {doc.reviewCount} review{doc.reviewCount === 1 ? "" : "s"}
            </Text>
            {doc.omittedConflict ? (
              <Text style={styles.metaChip}>{doc.omittedConflict} conflict omitted</Text>
            ) : null}
            {doc.rounds.map((round) => (
              <Text key={round.id} style={styles.metaChip}>
                {round.label}: {round.reviewCount}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.rubric}>Rubric: {RUBRIC_URL}</Text>
        {doc.warning ? <Text style={styles.warning}>{doc.warning}</Text> : null}

        {doc.rounds.length === 0 ? (
          <View>
            <View style={styles.sectionRule} />
            <Text style={styles.emptyTitle}>No judge feedback yet</Text>
            <Text style={styles.emptyBody}>
              Linked judge reviews will appear here once they are submitted. Conflict-of-interest reviews are omitted automatically.
            </Text>
          </View>
        ) : (
          doc.rounds.map((round) => <RoundBlock key={round.id} round={round} />)
        )}
      </Page>
    </Document>
  );
}

function RoundBlock({ round }: { round: FeedbackRound }) {
  return (
    <View style={styles.round} wrap>
      <View wrap={false} minPresenceAhead={72}>
        <View style={styles.sectionRule} />
        <Text style={styles.sectionTitle}>{round.label}</Text>
        <Text style={styles.sectionMeta}>
          {round.reviewCount} anonymized review{round.reviewCount === 1 ? "" : "s"}
          {round.questions.some((question) => question.average != null)
            ? ` · avg ${round.questions
                .filter((question) => question.average != null)
                .map((question) => `${question.average}`)
                .slice(0, 3)
                .join(" / ")}`
            : ""}
        </Text>
      </View>

      {round.questions.map((question) => (
        <QuestionBlock key={question.id} question={question} />
      ))}

      <CommentSection title="Key Strengths" comments={round.strengths} empty="No strengths were recorded in this round." />
      <CommentSection
        title="Room for Improvement"
        comments={round.improvements}
        empty="No improvement notes were recorded in this round."
      />
    </View>
  );
}

function QuestionBlock({ question }: { question: FeedbackQuestion }) {
  return (
    <View style={styles.question} wrap>
      <View style={styles.questionHead} wrap={false} minPresenceAhead={56}>
        <Text style={styles.questionTitle}>{question.title}</Text>
        <Text style={styles.questionStats}>
          avg {question.average ?? "—"} · spread {question.spread}
        </Text>
      </View>
      {question.chips.length ? (
        <View style={styles.chipRow} wrap>
          {question.chips.map((chip) => (
            <Text key={`${question.id}-${chip.judge}`} style={styles.chip} wrap={false}>
              {chip.judge} · {chip.label}
            </Text>
          ))}
        </View>
      ) : null}
      {question.comments.map((comment, index) => (
        <CommentCard key={`${question.id}-${comment.judge}-${index}`} comment={comment} />
      ))}
    </View>
  );
}

function CommentSection({
  title,
  comments,
  empty,
}: {
  title: string;
  comments: FeedbackComment[];
  empty: string;
}) {
  return (
    <View style={styles.question} wrap>
      <View style={styles.questionHead} wrap={false} minPresenceAhead={56}>
        <Text style={styles.questionTitle}>{title}</Text>
      </View>
      {comments.length ? (
        comments.map((comment, index) => (
          <CommentCard key={`${title}-${comment.judge}-${index}`} comment={comment} />
        ))
      ) : (
        <Text style={styles.empty}>{empty}</Text>
      )}
    </View>
  );
}

function CommentCard({ comment }: { comment: FeedbackComment }) {
  return (
    <View style={styles.card} wrap minPresenceAhead={36}>
      <Text style={styles.cardJudge}>{comment.judge}</Text>
      <Text style={styles.cardText}>{comment.text}</Text>
    </View>
  );
}

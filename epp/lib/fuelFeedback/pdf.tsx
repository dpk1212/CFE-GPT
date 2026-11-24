import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { RUBRIC_URL, type FeedbackDocument, type FeedbackRound } from "./types";

const navy = "#00274C";
const maize = "#FFCB05";
const ink = "#1E1E1E";
const muted = "#5A6570";
const line = "#D5DCE3";
const paper = "#F4F7FA";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 46,
    fontFamily: "Poppins",
    fontSize: 10,
    color: ink,
    lineHeight: 1.45,
  },
  coverBar: {
    backgroundColor: navy,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  brand: {
    color: maize,
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Poppins",
    fontWeight: 700,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: 700,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  subtitle: {
    color: "#D7E2EE",
    fontSize: 10,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    backgroundColor: "#013B71",
    color: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  section: {
    marginTop: 16,
    marginBottom: 4,
  },
  sectionRule: {
    height: 3,
    width: 42,
    backgroundColor: maize,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins",
    fontWeight: 700,
    color: navy,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionMeta: {
    color: muted,
    fontSize: 9,
    marginBottom: 8,
  },
  questionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingBottom: 4,
  },
  questionTitle: {
    fontSize: 11,
    fontFamily: "Poppins",
    fontWeight: 700,
    color: navy,
    maxWidth: "72%",
  },
  questionStats: {
    fontSize: 9,
    color: muted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: paper,
    borderWidth: 1,
    borderColor: line,
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontSize: 8,
    color: navy,
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
    letterSpacing: 1,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 3,
    fontFamily: "Poppins",
    fontWeight: 700,
  },
  cardText: {
    fontSize: 10,
    color: ink,
  },
  empty: {
    color: muted,
    fontSize: 9,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: "Poppins",
    fontWeight: 700,
    color: navy,
    marginTop: 18,
    marginBottom: 6,
  },
  emptyBody: {
    color: muted,
    fontSize: 10,
    marginBottom: 6,
    maxWidth: 420,
  },
  footer: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    color: muted,
    fontSize: 8,
  },
  rubric: {
    color: muted,
    fontSize: 9,
    marginBottom: 4,
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
        <View style={styles.coverBar}>
          <Text style={styles.brand}>Center for Entrepreneurship · Fuel</Text>
          <Text style={styles.title}>{"Judge's Feedback"}</Text>
          <Text style={styles.subtitle}>{doc.projectName}</Text>
          {doc.summary ? <Text style={styles.subtitle}>{doc.summary}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{doc.reviewCount} review{doc.reviewCount === 1 ? "" : "s"}</Text>
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
        {doc.warning ? <Text style={styles.empty}>{doc.warning}</Text> : null}

        {doc.rounds.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRule} />
            <Text style={styles.emptyTitle}>No judge feedback yet</Text>
            <Text style={styles.emptyBody}>
              Linked judge reviews will appear here once they are submitted. Conflict-of-interest reviews are omitted automatically.
            </Text>
          </View>
        ) : (
          doc.rounds.map((round) => <RoundBlock key={round.id} round={round} />)
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `University of Michigan · CFE Fuel  ·  Confidential judge feedback  ·  ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

function RoundBlock({ round }: { round: FeedbackRound }) {
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionRule} />
      <Text style={styles.sectionTitle}>{round.label}</Text>
      <Text style={styles.sectionMeta}>
        {round.reviewCount} anonymized review{round.reviewCount === 1 ? "" : "s"}
        {round.questions.length
          ? ` · avg ${round.questions
              .filter((q) => q.average != null)
              .map((q) => `${q.average}`)
              .slice(0, 3)
              .join(" / ") || "—"}`
          : ""}
      </Text>

      {round.questions.map((question) => (
        <View key={question.id} wrap={false}>
          <View style={styles.questionHead}>
            <Text style={styles.questionTitle}>{question.title}</Text>
            <Text style={styles.questionStats}>
              avg {question.average ?? "—"} · spread {question.spread}
            </Text>
          </View>
          {question.chips.length ? (
            <View style={styles.chipRow}>
              {question.chips.map((chip) => (
                <Text key={`${question.id}-${chip.judge}`} style={styles.chip}>
                  {chip.judge} · {chip.label}
                </Text>
              ))}
            </View>
          ) : null}
          {question.comments.map((comment) => (
            <View key={`${question.id}-${comment.judge}-${comment.text.slice(0, 24)}`} style={styles.card}>
              <Text style={styles.cardJudge}>{comment.judge}</Text>
              <Text style={styles.cardText}>{comment.text}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.questionHead}>
        <Text style={styles.questionTitle}>Key Strengths</Text>
      </View>
      {round.strengths.length ? (
        round.strengths.map((comment) => (
          <View key={`s-${comment.judge}-${comment.text.slice(0, 24)}`} style={styles.card}>
            <Text style={styles.cardJudge}>{comment.judge}</Text>
            <Text style={styles.cardText}>{comment.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No strengths were recorded in this round.</Text>
      )}

      <View style={styles.questionHead}>
        <Text style={styles.questionTitle}>Room for Improvement</Text>
      </View>
      {round.improvements.length ? (
        round.improvements.map((comment) => (
          <View key={`i-${comment.judge}-${comment.text.slice(0, 24)}`} style={styles.card}>
            <Text style={styles.cardJudge}>{comment.judge}</Text>
            <Text style={styles.cardText}>{comment.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No improvement notes were recorded in this round.</Text>
      )}
    </View>
  );
}

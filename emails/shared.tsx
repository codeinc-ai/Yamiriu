import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const brand = {
  cream: "#f7f3ec",
  ink: "#17140f",
  terracotta: "#bc5b39",
  olive: "#6b6e4c",
  gold: "#ac8968",
};

const main: React.CSSProperties = {
  backgroundColor: brand.cream,
  color: brand.ink,
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e7e0d4",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "40px",
};

const wordmark: React.CSSProperties = {
  color: brand.ink,
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  margin: 0,
  textAlign: "center",
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  color: brand.ink,
  fontSize: "22px",
  fontWeight: 600,
  lineHeight: 1.3,
  margin: "28px 0 12px",
};

const paragraph: React.CSSProperties = {
  color: "#3f3a31",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "15px",
  lineHeight: 1.6,
  margin: "0 0 16px",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: brand.terracotta,
  borderRadius: "4px",
  color: "#ffffff",
  display: "inline-block",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  padding: "13px 28px",
  textDecoration: "none",
};

const muted: React.CSSProperties = {
  color: brand.olive,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  lineHeight: 1.5,
  margin: "8px 0 0",
  wordBreak: "break-all",
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e7e0d4",
  margin: "28px 0 16px",
};

export const emailStyles = { paragraph, buttonStyle, muted };

export function BrandEmailShell({
  preview,
  heading: headingText,
  children,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={wordmark}>Yamiriu</Text>
          <Heading style={heading}>{headingText}</Heading>
          {children}
          <Hr style={hr} />
          <Section>
            <Text style={muted}>
              Yamiriu — Italian style, made yours. If you didn&apos;t expect this
              email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

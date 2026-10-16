import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlogIndex from "../components/BlogIndex";
import BlogPost from "../components/BlogPost";
import { blog } from "../data/blog";

describe("blog system", () => {
  it("includes the RAG and grounding blog post in blog data", () => {
    const post = blog.find((p) => p.slug === "rag-grounding-and-reducing-ai-hallucinations");
    expect(post).toBeDefined();
    expect(post.title).toContain("RAG, Grounding");
    expect(post.tags).toContain("AI Solutions");
    expect(post.tags).toContain("RAG & Grounding");
    expect(post.body.length).toBeGreaterThanOrEqual(4);
  });

  it("renders the new RAG post on the blog index", () => {
    render(<BlogIndex />);

    const link = screen.getByRole("heading", {
      level: 2,
      name: /RAG, Grounding, and Practical Tips for Stopping AI Hallucinations/i,
    });
    expect(link).toBeInTheDocument();
  });

  it("renders the blog post page with sections, tags, and contact CTA", () => {
    const post = blog.find((p) => p.slug === "rag-grounding-and-reducing-ai-hallucinations");
    render(<BlogPost post={post} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /RAG, Grounding, and Practical Tips for Stopping AI Hallucinations/i,
      })
    ).toBeInTheDocument();

    // Verify key section headings
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Why language models hallucinate/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Retrieval-Augmented Generation: Giving the model an open book/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Five engineering patterns that slash hallucinations in production/i,
      })
    ).toBeInTheDocument();

    // Verify tags
    expect(screen.getByText("RAG & Grounding")).toBeInTheDocument();
    expect(screen.getByText("AI Solutions")).toBeInTheDocument();

    // Verify CTA
    expect(screen.getByRole("link", { name: /Talk to Bluecore/i })).toBeInTheDocument();
  });
});

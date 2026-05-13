import type {
  Response,
  ResponseOutputMessage,
  ResponseOutputText,
} from "openai/resources/responses/responses.js";

const MASKED_LINK_TEXT = "src";

export function renderDiscordResponse(response: Response): string {
  const parts: string[] = [];

  for (const item of response.output) {
    if (!isOutputMessage(item) || item.role !== "assistant") continue;

    for (const content of item.content) {
      if (content.type !== "output_text") continue;
      parts.push(rewriteUrlCitationLinks(content));
    }
  }

  return parts.join("\n\n");
}

function rewriteUrlCitationLinks(content: ResponseOutputText): string {
  let text = content.text;

  const urlCitations = content.annotations
    .filter(
      (annotation): annotation is ResponseOutputText.URLCitation =>
        annotation.type === "url_citation",
    )
    .sort((left, right) => right.start_index - left.start_index);

  for (const citation of urlCitations) {
    text = replaceCitationSegment(text, citation);
  }

  return text;
}

function replaceCitationSegment(text: string, citation: ResponseOutputText.URLCitation): string {
  const exclusiveSegment = text.slice(citation.start_index, citation.end_index);
  const exclusiveReplacement = rewriteMaskedLinkLabel(exclusiveSegment, citation.url);
  if (exclusiveReplacement !== exclusiveSegment) {
    return (
      text.slice(0, citation.start_index) + exclusiveReplacement + text.slice(citation.end_index)
    );
  }

  const inclusiveSegment = text.slice(citation.start_index, citation.end_index + 1);
  const inclusiveReplacement = rewriteMaskedLinkLabel(inclusiveSegment, citation.url);
  if (inclusiveReplacement !== inclusiveSegment) {
    return (
      text.slice(0, citation.start_index) +
      inclusiveReplacement +
      text.slice(citation.end_index + 1)
    );
  }

  return text;
}

function rewriteMaskedLinkLabel(segment: string, url: string): string {
  const maskedLinkPattern = new RegExp(`\\[[^\\]]+\\]\\(${escapeRegExp(url)}\\)`);
  return segment.replace(maskedLinkPattern, `[${MASKED_LINK_TEXT}](${url})`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isOutputMessage(item: Response["output"][number]): item is ResponseOutputMessage {
  return item.type === "message";
}

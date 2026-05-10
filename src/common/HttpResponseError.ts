
function normalizeJsonError(asData: {}): string {
  const typed:
    | string
    | {
        message?: unknown,
      } = asData;
  if (Array.isArray(typed)) {
    return (
      typed
        .filter((a) => a)
        .map(normalizeJsonError)
        .join("; ") || "(empty list)"
    );
  } else if (typeof typed === "string") {
    return typed;
  } else {
    const message = typed.message ?? null;
    if (!message) {
      return "(unknown format) " + JSON.stringify(asData);
    } else if (typeof message === "string") {
      return message;
    } else {
      return "(message data) " + JSON.stringify(message);
    }
  }
}

function interpretErrorMessage(text: string, headers: Response["headers"]) {
  const contentTypeRaw = headers.get("content-type");
  const contentType = !contentTypeRaw ? null : contentTypeRaw.split(";")[0].trim();
  if (contentType === "application/json") {
    let asData;
    try {
      asData = JSON.parse(text) as {} | null;
    } catch {
      return "(malformed JSON) " + text;
    }
    if (!asData) {
      return "(null JSON)";
    }
    return normalizeJsonError(asData);
  } else {
    return text || "(no response)";
  }
}

/**
 * This error represents an unsuccessful response of a fetch() call.
 * It provides you with the normalized string error message extracted from the response body.
 * It also lets you access the response object directly if you need to check the status code or headers for your app logic.
 */
export class HttpResponseError extends Error {
  readonly response: Response;

  private constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }

  /**
   * If you need to do a yet another fetch with yet another error
   * handling, you may, possibly, find this helper method appealing.
   * Encapsulates the inconvenient transport logic of normalizing response
   * body into a string error message with all corner cases I could imagine.
   * @param errorSuffix - an optional extra context text that will be appended to the main message
   */
  static async fromResponse(response: Response, errorSuffix = ""): Promise<HttpResponseError> {
    let message: string;
    try {
      const text = await response.text();
      message = interpretErrorMessage(text, response.headers);
    } catch (error) {
      message = "(body disconnected) " + String(error);
    }
    return new HttpResponseError(response.statusText + ": " + message + errorSuffix, response);
  }
}
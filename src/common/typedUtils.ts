
type ErrorLike = Error | { message?: unknown, cause?: ErrorLike };

/**
 * SQL errors in particular have several levels of nesting with the
 * actual error message being in the very bottom of cause chain
 */
function getDeepestCause(error: ErrorLike) {
    const occurrences = new Set<ErrorLike>([error]);
    while (error.cause) {
        if (occurrences.has(error.cause)) {
            // circular reference
            break;
        }
        occurrences.add(error.cause);
        error = error.cause;
    }
    return error;
}

function stringifyErrorShallow(error: unknown) {
    if (!error) {
        return "(empty error)";
    } else if (
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message !== ""
    ) {
        const realCause = getDeepestCause(error);
        let prefix = "";
        if (realCause !== error) {
            prefix = stringifyErrorShallow(realCause) + "; which caused: ";
        }
        return prefix + String(error.message);
    } else if (typeof error === "string") {
        return error;
    } else if (error + "" !== "[object Object]") {
        return error + "";
    } else {
        return "Unknown format error: " + JSON.stringify(error);
    }
}

/**
 * many libraries throw objects that do not extend Error, this function attempts
 * to extract the message from any kind of error object using popular conventions
 * like having `toString()` implementation or `message` property
 * @return {string}
 */
export function stringifyError(error: unknown) {
    if (error instanceof AggregateError) {
        return error.errors.map(stringifyErrorShallow).join("\n");
    } else {
        return stringifyErrorShallow(error);
    }
}
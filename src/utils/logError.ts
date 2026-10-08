const getErrorCode = (err: unknown): string | number | undefined => {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = err.code;
    if (typeof code === "string" || typeof code === "number") {
      return code;
    }
  }
  return undefined;
};

export const logError = (context: string, err: unknown): void => {
  const message = err instanceof Error ? err.message : String(err);
  const code = getErrorCode(err);
  if (code !== undefined) {
    console.error(`${context}: ${message} (code: ${code})`);
    return;
  }
  console.error(`${context}: ${message}`);
};

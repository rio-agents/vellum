export function defaultFormatNumber(val: number, step?: number): string {
  if (step !== undefined && step > 0) {
    const stepStr = step.toString();
    const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;
    return val.toFixed(decimals);
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
}

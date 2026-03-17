export function scaleIngredient(ingredient: string, scale: number): string {
  if (scale === 1) return ingredient;
  return ingredient.replace(
    /(\d+\/\d+|\d+\.\d+|\d+)/g,
    (match, _p1, offset, str) => {
      const after = str.slice(offset + match.length);
      if (/^\s*°[FC]/i.test(after)) return match;
      if (/°[FC]/i.test(str.slice(offset, offset + match.length + 5)))
        return match;
      if (/^\s*(minutes?|hours?|seconds?)/i.test(after)) return match;

      if (match.includes("/")) {
        const [num, den] = match.split("/").map(Number);
        const result = (num / den) * scale;
        return result % 1 === 0
          ? String(result)
          : result.toFixed(1).replace(/\.0$/, "");
      }
      const result = parseFloat(match) * scale;
      return result % 1 === 0
        ? String(result)
        : result.toFixed(1).replace(/\.0$/, "");
    },
  );
}

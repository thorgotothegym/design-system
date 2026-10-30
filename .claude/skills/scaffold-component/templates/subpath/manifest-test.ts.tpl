
  it("should ship __Name__ as its own entry point, not from the root entry", () => {
    const root = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    // SCAFFOLD-PLACEHOLDER: say what exporting it from the root would cost every other component.
    expect(pkg.exports).toHaveProperty("./__name__");
    expect(root).not.toMatch(/__name__|__dependencyPattern__/);
  });

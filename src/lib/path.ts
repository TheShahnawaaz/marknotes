const path = {
  basename: (p: string) => p.replace(/\\/g, "/").split("/").pop() ?? p,
  join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
  dirname: (p: string) => p.replace(/\\/g, "/").split("/").slice(0, -1).join("/"),
};

export default path;

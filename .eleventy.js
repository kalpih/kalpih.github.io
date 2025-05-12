module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("favicon.ico");

  return {
    passthroughFileCopy: true,
    dir: {
      input: ".",
      includes: "_includes",
      layouts: "_layouts",
      output: "docs"
    },
    pathPrefix: "/"
  };
};
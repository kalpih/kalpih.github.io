// .eleventy.js
module.exports = function(eleventyConfig) {
  // Tell Eleventy to copy the 'css' directory to the output folder.
  eleventyConfig.addPassthroughCopy("css"); // Assumes 'css' folder is in your project root

  // Tell Eleventy to copy the 'js' directory to the output folder.
  eleventyConfig.addPassthroughCopy("js");   // Assumes 'js' folder is in your project root

  // Tell Eleventy to copy your 'images' directory if you have one.
  eleventyConfig.addPassthroughCopy("images"); // Assumes 'images' folder is in your project root

  // You can return your Config object (optional, but good practice).
  return {
    // When a passthrough file is modified, rebuild the site appropriately.
    passthroughFileCopy: true,
    dir: {
      input: ".",         // Root folder for source files (current directory).
      includes: "_includes", // Folder for reusable HTML partials.
      layouts: "_layouts",   // Folder for HTML page layouts.
      output: "docs"      // Folder where the generated static site will go.
    },
    // === ADD OR ENSURE THIS LINE IS CORRECT ===
    pathPrefix: "/kallepihlainen/" // <<< THIS IS THE KEY!
    // ========================================
  };
};
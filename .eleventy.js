// .eleventy.js
module.exports = function(eleventyConfig) {
  // Tell Eleventy to copy the 'css' directory to the output folder.
  // We'll move your style.css into a 'css' folder shortly.
  eleventyConfig.addPassthroughCopy("css");

  // Tell Eleventy to copy the 'js' directory to the output folder.
  // We'll move your script.js into a 'js' folder shortly.
  eleventyConfig.addPassthroughCopy("js");

  // Tell Eleventy to copy your 'images' directory if you have one.
  // Make sure it's in the root of your project or adjust the path.
  eleventyConfig.addPassthroughCopy("images");

  // You can return your Config object (optional, but good practice).
  return {
    // When a passthrough file is modified, rebuild the site appropriately.
    passthroughFileCopy: true,
    dir: {
      input: ".",          // Root folder for source files (current directory).
      includes: "_includes", // Folder for reusable HTML partials.
      layouts: "_layouts",   // Folder for HTML page layouts.
      output: "docs"      // Folder where the generated static site will go.
    }
  };
};
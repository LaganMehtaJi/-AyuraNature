const fs = require('fs');

function fixUrls(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the data-id inside article string to include data-slug
  content = content.replace(/data-id="\$\{post\._id\}"/g, 'data-id="${post._id}" data-slug="${post.slug || encodeURIComponent(post.title)}"');
  content = content.replace(/data-id="\$\{p\._id\}"/g, 'data-id="${p._id}" data-slug="${p.slug || encodeURIComponent(p.title)}"');
  
  // Replace click listeners grabbing ID
  content = content.replace(/const id = card\.getAttribute\('data-id'\);\s*window\.location\.href = `blog-detail\?id=\$\{id\}`/g, 'const slug = card.getAttribute(\'data-slug\') || card.getAttribute(\'data-id\');\n      window.location.href = `blog-detail?title=${slug}`');
  
  content = content.replace(/const id = card\.getAttribute\("data-id"\);\s*if\s*\(id\)\s*window\.location\.href = `blog-detail\?id=\$\{id\}`/g, 'const slug = card.getAttribute("data-slug") || card.getAttribute("data-id");\n      if(slug) window.location.href = `blog-detail?title=${slug}`');
  
  content = content.replace(/const id = this\.getAttribute\('data-id'\);\s*if\s*\(id\)\s*window\.location\.href = `blog-detail\?id=\$\{id\}`/g, 'const slug = this.getAttribute(\'data-slug\') || this.getAttribute(\'data-id\');\n      if(slug) window.location.href = `blog-detail?title=${slug}`');

  fs.writeFileSync(file, content);
}

fixUrls('c:/Users/lenovo/OneDrive/Desktop/-AyuraNature/Frontend/category.html');
fixUrls('c:/Users/lenovo/OneDrive/Desktop/-AyuraNature/Frontend/home.html');

console.log("URLs fixed in home and category");

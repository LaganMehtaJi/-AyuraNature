const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace in category.html (line 229)
  content = content.replace('function showDetail(id) {\n      window.location.href = `blog-detail?id=${id}`;\n    }', 
                            'function showDetail(id) {\n      const post = window.categoryPosts ? window.categoryPosts.find(p => p._id === id) : null;\n      const slug = post && post.slug ? post.slug : id;\n      window.location.href = `blog-detail?title=${slug}`;\n    }');

  // Replace in home.html (line 523)
  content = content.replace('        const id = card.getAttribute(\'data-id\'); \n        if(id) window.location.href = `blog-detail?id=${id}`; ',
                            '        const id = card.getAttribute(\'data-id\'); \n        const slug = card.getAttribute(\'data-slug\') || id;\n        if(slug) window.location.href = `blog-detail?title=${slug}`; ');

  fs.writeFileSync(file, content);
}

fix('c:/Users/lenovo/OneDrive/Desktop/-AyuraNature/Frontend/category.html');
fix('c:/Users/lenovo/OneDrive/Desktop/-AyuraNature/Frontend/home.html');

console.log("Done");

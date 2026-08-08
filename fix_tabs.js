const fs = require('fs');
['index.html', 'category.html', 'home.html'].forEach(f => {
  const path = 'c:/Users/lenovo/OneDrive/Desktop/-AyuraNature/Frontend/' + f;
  let html = fs.readFileSync(path, 'utf8');
  
  // Replace window.location.href = `blog-detail?title=${...}` with window.open(..., '_blank')
  html = html.replace(/window\.location\.href\s*=\s*`blog-detail\?title=\$\{([^}]+)\}`/g, 'window.open(`blog-detail?title=${$1}`, \'_blank\')');
  
  fs.writeFileSync(path, html);
});
console.log('Updated to open in new tab');

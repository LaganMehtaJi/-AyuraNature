
  // ---------- API ENDPOINT ----------
  const API_BASE_URL = 'https://api.ayuranature.com/api/posts';  const STORAGE_ADMIN_SETTINGS = 'ayuranature_admin_settings';
  let blogPosts = [];
  let adminSettings = { adsEnabled: true, showInlineAds: true, adFrequency: 3 };
  let currentEditorDiv = null;

  async function loadData() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch posts');
      blogPosts = await response.json();
      renderPostsList("");
    } catch (err) {
      // Silent error
    }
    
    const settingsStored = localStorage.getItem(STORAGE_ADMIN_SETTINGS);
    if (settingsStored) adminSettings = JSON.parse(settingsStored);
    else saveSettings();
  }
  
  function saveSettings() { localStorage.setItem(STORAGE_ADMIN_SETTINGS, JSON.stringify(adminSettings)); }

  // Helper: Update stats & render post list
  function updateDashboardStats() {
    document.getElementById("totalPostsCount").innerText = blogPosts.length;
    document.getElementById("featuredCount").innerText = blogPosts.filter(p => p.featured).length;
  }

  function renderPostsList(filter = "") {
    const container = document.getElementById("postsListContainer");
    const noMsg = document.getElementById("noPostsMsg");
    if (!container) return;
    let filtered = blogPosts;
    if (filter.trim()) filtered = blogPosts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()));
    if (filtered.length === 0) { container.innerHTML = ""; noMsg.classList.remove("hidden"); updateDashboardStats(); return; }
    noMsg.classList.add("hidden");
    container.innerHTML = filtered.map(post => `
      <div class="post-list-item bg-white rounded-xl p-4 border border-stone-200 flex flex-wrap justify-between items-start gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="font-bold text-stone-800">${escapeHtml(post.title.substring(0, 70))}</h2>
            ${post.featured ? '<span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Featured</span>' : ''}
            <span class="text-xs text-stone-400">${post.date ? post.date.split('T')[0] : 'no date'}</span>
          </div>
          <p class="text-sm text-stone-500 line-clamp-1">${escapeHtml(post.excerpt.substring(0, 100))}</p>
          <div class="text-xs text-stone-400 mt-1">${post.category || 'Uncategorized'} • ${post.tags?.join(', ') || ''}</div>
        </div>
        <div class="flex gap-2">
          <button class="editPostBtn text-blue-600 hover:text-blue-800 p-1" data-id="${post._id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="deletePostBtn text-red-600 hover:text-red-800 p-1" data-id="${post._id}"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
      </div>
    `).join('');
    // attach edit/delete events
    document.querySelectorAll(".editPostBtn").forEach(btn => btn.addEventListener("click", (e) => { const id = btn.getAttribute("data-id"); openPostModal(id); }));
    document.querySelectorAll(".deletePostBtn").forEach(btn => btn.addEventListener("click", async (e) => { 
      if(confirm("Permanently delete this blog?")) { 
        const id = btn.getAttribute("data-id"); 
        try {
          const res = await fetch(`${API_BASE_URL}/delete/${id}`, { method: 'DELETE' });
          if(res.ok) {
            blogPosts = blogPosts.filter(p => p._id !== id);
            renderPostsList(document.getElementById("adminSearchInput").value);
            updateDashboardStats();
          }
        } catch(err) {
          // Silent error
        }
      } 
    }));
    updateDashboardStats();
  }

  function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

  // **************** RICH EDITOR LOGIC ****************
  function initRichEditor(containerId) {
    currentEditorDiv = document.getElementById(containerId);
    if(!currentEditorDiv) return;
    // Toolbar commands
    const btns = document.querySelectorAll(".editor-toolbar button[data-cmd]");
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        const cmd = btn.getAttribute("data-cmd");
        const val = btn.getAttribute("data-value");
        if(cmd === "formatBlock") document.execCommand("formatBlock", false, val);
        else document.execCommand(cmd, false, null);
        currentEditorDiv.focus();
      });
    });
    document.getElementById("insertTableBtn")?.addEventListener("click", () => {
      const rows = prompt("Number of rows?", "3");
      const cols = prompt("Number of columns?", "2");
      if(rows && cols) {
        let table = '<table border="1" style="border-collapse:collapse; width:100%">';
        for(let i=0; i<parseInt(rows); i++) {
          table += '<tr>';
          for(let j=0; j<parseInt(cols); j++) table += `<td>${i===0 && j===0 ? 'Header' : 'Data'}</td>`;
          table += '</tr>';
        }
        table += '</table><br>';
        document.execCommand("insertHTML", false, table);
      }
    });
    document.getElementById("insertGraphBtn")?.addEventListener("click", () => {
      let labels = prompt("Chart labels (comma):", "Jan,Feb,Mar,Apr");
      let values = prompt("Values (comma):", "12,19,8,15");
      if(labels && values) {
        const lblArr = labels.split(',').map(s=>s.trim());
        const valArr = values.split(',').map(v=>parseFloat(v.trim()));
        const uid = 'chart_' + Date.now() + Math.floor(Math.random()*1000);
        const chartHtml = `<div class="chart-preview"><canvas id="${uid}" style="max-height:220px;"></canvas><div class="text-xs text-center mt-1">📊 Wellness Analytics</div></div><script>setTimeout(()=>{ const ctx = document.getElementById('${uid}').getContext('2d'); new Chart(ctx, { type: 'bar', data: { labels: ${JSON.stringify(lblArr)}, datasets: [{ label: 'Holistic Impact', data: ${JSON.stringify(valArr)}, backgroundColor: '#cb9e6b' }] } }); }, 80);<\/script>`;
        document.execCommand("insertHTML", false, chartHtml);
      } else alert("Chart requires both labels and values");
    });
    document.getElementById("clearFormatBtn")?.addEventListener("click", () => {
      document.execCommand("removeFormat", false, null);
      currentEditorDiv.focus();
    });
  }
  function getEditorContent() { return currentEditorDiv ? currentEditorDiv.innerHTML : ''; }
  function setEditorContent(html) { if(currentEditorDiv) currentEditorDiv.innerHTML = html || '<p>Start writing your holistic article...</p>'; }
  
  // **************** CRUD MODAL ****************
  // ========== META TAGS DYNAMIC UI ==========
  function addMetaTagRow(name = '', content = '') {
    const container = document.getElementById('metaTagsContainer');
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `
      <select class="meta-tag-name border border-stone-300 rounded-lg p-2 text-sm w-40">
        <option value="keywords" ${name==='keywords'?'selected':''}>keywords</option>
        <option value="author" ${name==='author'?'selected':''}>author</option>
        <option value="robots" ${name==='robots'?'selected':''}>robots</option>
        <option value="og:title" ${name==='og:title'?'selected':''}>og:title</option>
        <option value="og:description" ${name==='og:description'?'selected':''}>og:description</option>
        <option value="og:image" ${name==='og:image'?'selected':''}>og:image</option>
        <option value="og:type" ${name==='og:type'?'selected':''}>og:type</option>
        <option value="twitter:card" ${name==='twitter:card'?'selected':''}>twitter:card</option>
        <option value="twitter:title" ${name==='twitter:title'?'selected':''}>twitter:title</option>
        <option value="twitter:description" ${name==='twitter:description'?'selected':''}>twitter:description</option>
        <option value="custom" ${!['keywords','author','robots','og:title','og:description','og:image','og:type','twitter:card','twitter:title','twitter:description'].includes(name) && name ? 'selected' : ''}>custom...</option>
      </select>
      <input type="text" class="meta-tag-custom border border-stone-300 rounded-lg p-2 text-sm w-28 ${['keywords','author','robots','og:title','og:description','og:image','og:type','twitter:card','twitter:title','twitter:description'].includes(name) || !name ? 'hidden' : ''}" placeholder="Custom name" value="${!['keywords','author','robots','og:title','og:description','og:image','og:type','twitter:card','twitter:title','twitter:description'].includes(name) && name ? escapeHtml(name) : ''}">
      <input type="text" class="meta-tag-content flex-1 border border-stone-300 rounded-lg p-2 text-sm" placeholder="Content value" value="${escapeHtml(content)}">
      <button type="button" class="text-red-500 hover:text-red-700 text-lg" onclick="this.parentElement.remove()">✕</button>
    `;
    // Show/hide custom input based on select
    const select = row.querySelector('.meta-tag-name');
    const customInput = row.querySelector('.meta-tag-custom');
    select.addEventListener('change', () => {
      if(select.value === 'custom') { customInput.classList.remove('hidden'); } 
      else { customInput.classList.add('hidden'); }
    });
    container.appendChild(row);
  }

  function getMetaTagsFromUI() {
    const rows = document.querySelectorAll('#metaTagsContainer > div');
    const tags = [];
    rows.forEach(row => {
      const select = row.querySelector('.meta-tag-name');
      const customInput = row.querySelector('.meta-tag-custom');
      const contentInput = row.querySelector('.meta-tag-content');
      let name = select.value === 'custom' ? customInput.value.trim() : select.value;
      let content = contentInput.value.trim();
      if(name && content) tags.push({ name, content });
    });
    return tags;
  }

  function clearMetaTags() {
    document.getElementById('metaTagsContainer').innerHTML = '';
  }

  document.getElementById('addMetaTagBtn')?.addEventListener('click', () => addMetaTagRow());

  function openPostModal(postId = null) {
    const modal = document.getElementById("postModal");
    document.getElementById("editPostId").value = "";
    document.getElementById("postTitle").value = "";
    document.getElementById("postExcerpt").value = "";
    setEditorContent("<p>Write your content here. Use toolbar to add headings, tables, or charts.</p>");
    document.getElementById("postCategory").value = "Ayurveda & Natural Remedies";
    document.getElementById("postTags").value = "Wellness, Natural";
    document.getElementById("postOuterImage").value = "";
    document.getElementById("postOuterImageFile").value = "";
    document.getElementById("postInnerImage").value = "";
    document.getElementById("postInnerImageFile").value = "";
    document.getElementById("postFeatured").checked = false;
    document.getElementById("postDate").value = new Date().toISOString().slice(0,10);
    document.getElementById("modalTitle").innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Create New Blog';
    // Clear SEO fields
    document.getElementById("postMetaTitle").value = "";
    document.getElementById("postMetaDescription").value = "";
    clearMetaTags();
    document.getElementById("seoSection").classList.add("hidden");

    if(postId) {
      const post = blogPosts.find(p => p._id === postId);
      if(post) {
        document.getElementById("editPostId").value = post._id;
        document.getElementById("postTitle").value = post.title;
        document.getElementById("postExcerpt").value = post.excerpt;
        setEditorContent(post.fullContent || "<p>Edit your content...</p>");
        document.getElementById("postCategory").value = post.category || "";
        document.getElementById("postTags").value = (post.tags || []).join(", ");
        document.getElementById("postOuterImage").value = post.outerImage?.url || "";
        document.getElementById("postInnerImage").value = post.innerImage?.url || "";
        document.getElementById("postFeatured").checked = post.featured || false;
        document.getElementById("postDate").value = post.date ? post.date.split('T')[0] : new Date().toISOString().slice(0,10);
        document.getElementById("modalTitle").innerHTML = '<i class="fas fa-edit mr-2"></i> Edit Blog Post';
        // Pre-fill SEO fields
        document.getElementById("postMetaTitle").value = post.metaTitle || "";
        document.getElementById("postMetaDescription").value = post.metaDescription || "";
        if(post.metaTags && post.metaTags.length > 0) {
          post.metaTags.forEach(tag => addMetaTagRow(tag.name, tag.content));
          document.getElementById("seoSection").classList.remove("hidden");
        }
      }
    }
    // init rich editor instance after dom ready
    initRichEditor("richEditor");
    modal.classList.remove("hidden");
  }
  function closeModal() { document.getElementById("postModal").classList.add("hidden"); }
  
  async function savePostFromForm() {
    const id = document.getElementById("editPostId").value;
    const title = document.getElementById("postTitle").value.trim();
    const excerpt = document.getElementById("postExcerpt").value.trim();
    const fullContent = getEditorContent();
    const category = document.getElementById("postCategory").value.trim();
    const tags = document.getElementById("postTags").value.split(",").map(s=>s.trim()).filter(Boolean);
    const featured = document.getElementById("postFeatured").checked;
    const date = document.getElementById("postDate").value;
    
    const outerImageUrl = document.getElementById("postOuterImage").value.trim();
    const outerImageFile = document.getElementById("postOuterImageFile").files[0];
    const innerImageUrl = document.getElementById("postInnerImage").value.trim();
    const innerImageFile = document.getElementById("postInnerImageFile").files[0];

    if(!title || !excerpt) return alert("Title and Excerpt are required");

    const formData = new FormData();
    formData.append('title', title);
    formData.append('excerpt', excerpt);
    formData.append('fullContent', fullContent);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));
    formData.append('featured', featured);
    formData.append('date', date);

    // SEO fields
    const metaTitle = document.getElementById('postMetaTitle').value.trim();
    const metaDescription = document.getElementById('postMetaDescription').value.trim();
    const metaTags = getMetaTagsFromUI();
    if(metaTitle) formData.append('metaTitle', metaTitle);
    if(metaDescription) formData.append('metaDescription', metaDescription);
    if(metaTags.length > 0) formData.append('metaTags', JSON.stringify(metaTags));
    
    if(outerImageFile) formData.append('outerImage', outerImageFile);
    if(outerImageUrl) formData.append('outerImageUrl', outerImageUrl);
    if(innerImageFile) formData.append('innerImage', innerImageFile);
    if(innerImageUrl) formData.append('innerImageUrl', innerImageUrl);

    try {
      let url = `${API_BASE_URL}/add`;
      let method = 'POST';
      if(id) {
        url = `${API_BASE_URL}/update/${id}`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method: method,
        body: formData
      });

      if(res.ok) {
        const data = await res.json();
        closeModal();
        loadData();
      }
    } catch(err) {
      // Silent error
    }
  }

  // ************ LOGIN / LOGOUT ************
  let isLoggedIn = false;
  function showLogin() { document.getElementById("loginSection").classList.remove("hidden"); document.getElementById("dashboardSection").classList.add("hidden"); isLoggedIn = false; }
  function showDashboard() { document.getElementById("loginSection").classList.add("hidden"); document.getElementById("dashboardSection").classList.remove("hidden"); isLoggedIn = true; loadData(); updateDashboardStats(); loadSettingsToUI(); }
  function loadSettingsToUI() {
    document.getElementById("enableAdsToggle").checked = adminSettings.adsEnabled;
    document.getElementById("showInlineAdsToggle").checked = adminSettings.showInlineAds;
    document.getElementById("adFreqInput").value = adminSettings.adFrequency;
  }
  function saveAdminSettings() {
    adminSettings.adsEnabled = document.getElementById("enableAdsToggle").checked;
    adminSettings.showInlineAds = document.getElementById("showInlineAdsToggle").checked;
    adminSettings.adFrequency = parseInt(document.getElementById("adFreqInput").value) || 3;
    saveSettings();
  }

  // ************ EVENT LISTENERS ************
  document.getElementById("loginBtn")?.addEventListener("click", () => {
    const pwd = document.getElementById("adminPasswordInput").value;
    if(pwd === "ayura2026") showDashboard();
  });
  document.getElementById("logoutBtn")?.addEventListener("click", () => { showLogin(); document.getElementById("adminPasswordInput").value = ""; });
  document.getElementById("newPostMainBtn")?.addEventListener("click", () => openPostModal(null));
  document.getElementById("refreshPostListBtn")?.addEventListener("click", () => loadData());
  document.getElementById("adminSearchInput")?.addEventListener("input", (e) => renderPostsList(e.target.value));
  document.getElementById("saveSettingsBtn")?.addEventListener("click", saveAdminSettings);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("cancelModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("blogPostForm")?.addEventListener("submit", (e) => { e.preventDefault(); savePostFromForm(); });
  // close modal on overlay click? optional
  window.addEventListener("click", (e) => { if(e.target === document.getElementById("postModal")) closeModal(); });
  
  // initial load
  showLogin(); // start with login screen
  // populate settings ui later when dashboard shown

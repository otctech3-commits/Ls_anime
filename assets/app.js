let allAnime = [];
let currentTab = 'home';
let currentFilter = 'all';

// ===== FETCH FROM TELEGRAM =====
async function fetchFromTelegram(){
  document.getElementById('loading').style.display = 'block';
  document.getElementById('animeGrid').innerHTML = '';

  try{
    // Method 1: Using Telegram Bot API
    // Note: Direct API calls blocked by CORS. Use backend proxy.
    // For demo, we'll use sample data. In production, create PHP/Node backend.

    // Simulated fetch - Replace with your backend endpoint
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/getUpdates`);
    const data = await response.json();

    // Parse messages from your channel
    if(data.ok && data.result){
      parseTelegramMessages(data.result);
    }else{
      // Fallback: Load sample data
      loadSampleAnime();
    }
  }catch(err){
    console.error('TG Fetch Error:', err);
    loadSampleAnime(); // Load demo data
  }

  document.getElementById('loading').style.display = 'none';
}

// ===== PARSE TELEGRAM MESSAGES =====
function parseTelegramMessages(messages){
  allAnime = [];
  messages.forEach(msg=>{
    if(msg.channel_post && msg.channel_post.video){
      // Extract anime info from caption
      let caption = msg.channel_post.caption || '';
      let video = msg.channel_post.video;

      // Parse format: "Anime Name - Episode 1"
      let match = caption.match(/(.+?)\s*-\s*Episode\s*(\d+)/i);
      if(match){
        let name = match[1].trim();
        let ep = parseInt(match[2]);
        let fileId = video.file_id;

        // Check if anime exists
        let anime = allAnime.find(a=>a.name===name);
        if(!anime){
          anime = {name, episodes:[], thumb:'', rating:0, genres:[]};
          allAnime.push(anime);
        }
        anime.episodes.push({ep, fileId, fileUrl:''});
      }
    }
  });

  // Fetch details from Jikan API
  enrichAnimeData();
}

// ===== ENRICH WITH FREE API =====
async function enrichAnimeData(){
  for(let anime of allAnime){
    try{
      let res = await fetch(`${CONFIG.ANIME_API}/anime?q=${encodeURIComponent(anime.name)}&limit=1`);
      let data = await res.json();
      if(data.data && data.data[0]){
        let info = data.data[0];
        anime.thumb = info.images.jpg.large_image_url;
        anime.rating = info.score || 0;
        anime.genres = info.genres.map(g=>g.name.toLowerCase());
        anime.synopsis = info.synopsis;
        anime.year = info.year;
      }
    }catch(e){console.error('API Error:', e);}
  }
  renderAnime();
  updateHero();
}

// ===== SAMPLE DATA (For Testing) =====
function loadSampleAnime(){
  allAnime = [
    {
      name: "Attack on Titan",
      thumb: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
      rating: 9.0,
      genres: ['action','drama','fantasy'],
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'},
        {ep: 2, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'}
      ],
      synopsis: "Humanity fights for survival against giant humanoid Titans."
    },
    {
      name: "Demon Slayer",
      thumb: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
      rating: 8.7,
      genres: ['action','fantasy'],
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
      ],
      synopsis: "A young boy becomes a demon slayer to save his sister."
    },
    {
      name: "Jujutsu Kaisen",
      thumb: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
      rating: 8.8,
      genres: ['action','fantasy','horror'],
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'}
      ],
      synopsis: "Students battle cursed spirits in modern Japan."
    }
  ];
  renderAnime();
  updateHero();
}

// ===== RENDER ANIME GRID =====
function renderAnime(){
  let grid = document.getElementById('animeGrid');
  let noResults = document.getElementById('noResults');

  let filtered = allAnime.filter(a=>{
    if(currentFilter==='all') return true;
    return a.genres && a.genres.includes(currentFilter);
  });

  if(filtered.length===0){
    noResults.style.display='block';
    grid.innerHTML='';
    return;
  }

  noResults.style.display='none';
  let html='';
  filtered.forEach(anime=>{
    html+=`
      <div class="an-card" onclick="showDetails('${anime.name}')">
        <div class="an-card-img">
          <img src="${anime.thumb}" alt="${anime.name}" loading="lazy">
          <div class="an-card-badge">HD</div>
          <div class="an-card-ep">EP ${anime.episodes.length}</div>
        </div>
        <div class="an-card-content">
          <h3 class="an-card-title">${anime.name}</h3>
          <div class="an-card-info">
            <span class="an-card-rating">★ ${anime.rating}</span>
            <span>• ${anime.year||'2024'}</span>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML=html;
}

// ===== UPDATE HERO =====
function updateHero(){
  if(allAnime.length>0){
    let featured = allAnime[0];
    document.getElementById('heroTitle').innerText = featured.name;
    document.getElementById('heroDesc').innerText = featured.synopsis?.substring(0,150)+'...' || 'Watch now in HD';
    document.getElementById('heroBtn').style.display='inline-block';
    document.getElementById('heroBtn').onclick=()=>playAnime(featured.name,0);
  }
}

// ===== SEARCH =====
function handleSearch(e){
  if(e.key==='Enter') searchAnime();
}

function searchAnime(){
  let query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allAnime.filter(a=>a.name.toLowerCase().includes(query));

  let grid = document.getElementById('animeGrid');
  if(filtered.length===0){
    document.getElementById('noResults').style.display='block';
    grid.innerHTML='';
    return;
  }

  document.getElementById('noResults').style.display='none';
  let html='';
  filtered.forEach(anime=>{
    html+=`
      <div class="an-card" onclick="showDetails('${anime.name}')">
        <div class="an-card-img">
          <img src="${anime.thumb}" alt="${anime.name}">
          <div class="an-card-badge">HD</div>
          <div class="an-card-ep">EP ${anime.episodes.length}</div>
        </div>
        <div class="an-card-content">
          <h3 class="an-card-title">${anime.name}</h3>
          <div class="an-card-info">
            <span class="an-card-rating">★ ${anime.rating}</span>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML=html;
}

// ===== FILTERS =====
function filterGenre(genre,btn){
  document.querySelectorAll('.an-filter').forEach(f=>f.classList.remove('active'));
  btn.classList.add('active');
  currentFilter=genre;
  renderAnime();
}

function showTab(tab,btn){
  document.querySelectorAll('.an-nav-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentTab=tab;
  // Implement tab logic
  renderAnime();
}

// ===== SHOW DETAILS =====
function showDetails(name){
  let anime = allAnime.find(a=>a.name===name);
  if(!anime) return;

  document.getElementById('detailsBody').innerHTML=`
    <div style="padding:30px;">
      <img src="${anime.thumb}" style="width:100%;height:400px;object-fit:cover;border-radius:12px;margin-bottom:20px;">
      <h2 style="font-size:32px;margin-bottom:15px;color:#ff6b6b;">${anime.name}</h2>
      <div style="display:flex;gap:20px;margin-bottom:20px;color:#9ca3af;">
        <span>★ ${anime.rating}</span>
        <span>• ${anime.year||'2024'}</span>
        <span>• ${anime.episodes.length} Episodes</span>
      </div>
      <p style="color:#9ca3af;line-height:1.8;margin-bottom:30px;">${anime.synopsis||'No description available.'}</p>
      <button onclick="playAnime('${anime.name}',0)" style="width:100%;padding:16px;background:#ff6b6b;color:#0a0e1a;border:none;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer;">▶ Play Episode 1</button>
    </div>
  `;
  document.getElementById('detailsModal').classList.add('active');
}

function closeDetails(){
  document.getElementById('detailsModal').classList.remove('active');
}

// ===== VIDEO PLAYER =====
function playAnime(name,epIndex){
  let anime = allAnime.find(a=>a.name===name);
  if(!anime ||!anime.episodes[epIndex]) return;

  let episode = anime.episodes[epIndex];
  let player = document.getElementById('videoPlayer');

  // If using Telegram file_id, you need backend to get file_url
  // For demo, using direct URL
  player.src = episode.fileUrl || episode.fileId;

  document.getElementById('playerTitle').innerText = `${anime.name} - Episode ${episode.ep}`;

  // Load episode list
  let epHTML='';
  anime.episodes.forEach((ep,i)=>{
    epHTML+=`<div class="an-episode-item ${i===epIndex?'active':''}" onclick="playAnime('${name}',${i})">
      <strong>Episode ${ep.ep}</strong>
      <span>Click to play</span>
    </div>`;
  });
  document.getElementById('episodeList').innerHTML=epHTML;

  document.getElementById('playerModal').classList.add('active');
  closeDetails();
}

function closePlayer(){
  document.getElementById('playerModal').classList.remove('active');
  document.getElementById('videoPlayer').pause();
}

// ===== INIT =====
window.onload=()=>{
  fetchFromTelegram();
};

// Close modals on outside click
document.getElementById('playerModal').addEventListener('click',e=>{
  if(e.target===e.currentTarget) closePlayer();
});
document.getElementById('detailsModal').addEventListener('click',e=>{
  if(e.target===e.currentTarget) closeDetails();
});

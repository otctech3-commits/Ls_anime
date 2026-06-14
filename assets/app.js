// ===== MK ANIME - COMPLETE APP.JS =====
// Powered by MK BOTS

let allAnime = [];
let currentTab = 'home';
let currentFilter = 'all';

// ===== FETCH FROM TELEGRAM =====
async function fetchFromTelegram(){
  document.getElementById('loading').style.display = 'block';
  document.getElementById('animeGrid').innerHTML = '';
  
  try{
    // Using free CORS proxy - no PHP needed
    const proxy = 'https://api.allorigins.win/raw?url=';
    const tgUrl = `https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/getUpdates?limit=100`;
    const response = await fetch(proxy + encodeURIComponent(tgUrl));
    const data = await response.json();
    
    if(data.ok && data.result && data.result.length > 0){
      await parseTelegramMessages(data.result);
    }else{
      console.log('No TG posts found, loading samples');
      loadSampleAnime();
    }
  }catch(err){
    console.error('TG Error:', err);
    loadSampleAnime();
  }
  
  document.getElementById('loading').style.display = 'none';
}

// ===== PARSE TELEGRAM MESSAGES =====
async function parseTelegramMessages(messages){
  allAnime = [];
  
  for(let msg of messages){
    // Check if message is from our channel and has video
    if(msg.channel_post && msg.channel_post.chat && msg.channel_post.chat.id == CONFIG.TG_CHANNEL){
      if(msg.channel_post.video){
        let post = msg.channel_post;
        let caption = post.caption || '';
        let file_id = post.video.file_id;
        
        // Parse: "Attack on Titan - Episode 1" or "Attack on Titan - Ep 1"
        let match = caption.match(/(.+?)\s*-\s*(?:Episode|Ep\.?)\s*(\d+)/i);
        if(match){
          let name = match[1].trim();
          let ep = parseInt(match[2]);
          
          // Get actual video URL from Telegram
          try{
            const fileProxy = 'https://api.allorigins.win/raw?url=';
            const fileUrl = `https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/getFile?file_id=${file_id}`;
            const fileRes = await fetch(fileProxy + encodeURIComponent(fileUrl));
            const fileData = await fileRes.json();
            
            if(fileData.ok && fileData.result.file_path){
              const videoUrl = `https://api.telegram.org/file/bot${CONFIG.TG_BOT_TOKEN}/${fileData.result.file_path}`;
              
              let anime = allAnime.find(a=>a.name.toLowerCase()===name.toLowerCase());
              if(!anime){
                anime = {name, episodes:[], thumb:'', rating:0, genres:[], synopsis:'', year:2024};
                allAnime.push(anime);
              }
              
              // Check if episode already exists
              if(!anime.episodes.find(e=>e.ep===ep)){
                anime.episodes.push({ep, fileUrl: videoUrl});
              }
            }
          }catch(e){
            console.error('File fetch error:',e);
          }
        }
      }
    }
  }
  
  // Sort episodes for each anime
  allAnime.forEach(a=>a.episodes.sort((x,y)=>x.ep-y.ep));
  
  if(allAnime.length > 0){
    await enrichAnimeData();
  }else{
    console.log('No valid anime found in channel');
    loadSampleAnime();
  }
}

// ===== ENRICH WITH FREE API =====
async function enrichAnimeData(){
  for(let anime of allAnime){
    try{
      // Fetch from Jikan API - MyAnimeList
      let res = await fetch(`${CONFIG.ANIME_API}/anime?q=${encodeURIComponent(anime.name)}&limit=1`);
      let data = await res.json();
      
      if(data.data && data.data[0]){
        let info = data.data[0];
        anime.thumb = info.images.jpg.large_image_url || 'https://via.placeholder.com/300x400?text=No+Image';
        anime.rating = info.score || 0;
        anime.genres = info.genres? info.genres.map(g=>g.name.toLowerCase()) : ['unknown'];
        anime.synopsis = info.synopsis || 'No description available.';
        anime.year = info.year || 2024;
      }else{
        anime.thumb = 'https://via.placeholder.com/300x400?text=No+Image';
        anime.genres = ['unknown'];
      }
    }catch(e){
      console.error('API Error for', anime.name, e);
      anime.thumb = 'https://via.placeholder.com/300x400?text=No+Image';
      anime.genres = ['unknown'];
    }
  }
  renderAnime();
  updateHero();
}

// ===== SAMPLE DATA FALLBACK =====
function loadSampleAnime(){
  allAnime = [
    {
      name: "Attack on Titan",
      thumb: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
      rating: 9.0,
      genres: ['action','drama','fantasy'],
      year: 2013,
      synopsis: "Humanity fights for survival against giant humanoid Titans.",
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'},
        {ep: 2, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'}
      ]
    },
    {
      name: "Demon Slayer",
      thumb: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
      rating: 8.7,
      genres: ['action','fantasy'],
      year: 2019,
      synopsis: "A young boy becomes a demon slayer to save his sister.",
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
      ]
    },
    {
      name: "Jujutsu Kaisen",
      thumb: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
      rating: 8.8,
      genres: ['action','fantasy','horror'],
      year: 2020,
      synopsis: "Students battle cursed spirits in modern Japan.",
      episodes: [
        {ep: 1, fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'}
      ]
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
      <div class="an-card" onclick="showDetails('${anime.name.replace(/'/g,"\\'")}')">
        <div class="an-card-img">
          <img src="${anime.thumb}" alt="${anime.name}" loading="lazy">
          <div class="an-card-badge">HD</div>
          <div class="an-card-ep">EP ${anime.episodes.length}</div>
        </div>
        <div class="an-card-content">
          <h3 class="an-card-title">${anime.name}</h3>
          <div class="an-card-info">
            <span class="an-card-rating">★ ${anime.rating}</span>
            <span>• ${anime.year}</span>
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
      <div class="an-card" onclick="showDetails('${anime.name.replace(/'/g,"\\'")}')">
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
  
  if(tab==='trending'){
    allAnime.sort((a,b)=>b.rating-a.rating);
  }else if(tab==='latest'){
    allAnime.sort((a,b)=>b.year-a.year);
  }
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
        <span>• ${anime.year}</span>
        <span>• ${anime.episodes.length} Episodes</span>
      </div>
      <p style="color:#9ca3af;line-height:1.8;margin-bottom:30px;">${anime.synopsis}</p>
      <button onclick="playAnime('${anime.name.replace(/'/g,"\\'")}',0)" style="width:100%;padding:16px;background:#ff6b6b;color:#0a0e1a;border:none;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer;">▶ Play Episode 1</button>
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
  
  player.src = episode.fileUrl;
  document.getElementById('playerTitle').innerText = `${anime.name} - Episode ${episode.ep}`;
  
  // Load episode list
  let epHTML='';
  anime.episodes.forEach((ep,i)=>{
    epHTML+=`<div class="an-episode-item ${i===epIndex?'active':''}" onclick="playAnime('${name.replace(/'/g,"\\'")}',${i})">
      <strong>Episode ${ep.ep}</strong>
      <span>Click to play</span>
    </div>`;
  });
  document.getElementById('episodeList').innerHTML=epHTML;
  
  document.getElementById('playerModal').classList.add('active');
  closeDetails();
  
  if(CONFIG.AUTO_PLAY){
    player.play().catch(e=>console.log('Autoplay blocked:',e));
  }
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
document.addEventListener('click',e=>{
  if(e.target.id==='playerModal') closePlayer();
  if(e.target.id==='detailsModal') closeDetails();
});

/********************
 * Mentes Pinoleras - script.js
 * Firestore CRUD (posts) + Auth listener + UI helpers
 ********************/

let currentUser = null;
let feedUnsub = null;
let myPostsUnsub = null;

// Escucha de sesión
firebase.auth().onAuthStateChanged((user) => {
if (user) {
    currentUser = {
    id: user.uid,
    name: user.displayName || 'Usuario',
    email: user.email || '',
    avatar: user.photoURL || ''
    };

    // Mostrar UI principal si aplica
    if (typeof showMainApp === 'function') showMainApp();

    // Cargar data de Firestore
    if (typeof loadFeed === 'function') loadFeed(); // posts públicos
    if (typeof loadUserPosts === 'function') loadUserPosts(); // del usuario
} else {
    currentUser = null;

    // Si tienes una pantalla de login
    if (typeof showLogin === 'function') showLogin();

    // (Opcional) Feed público aun sin login
    if (typeof loadFeed === 'function') loadFeed();
}
});

// Helpers UI tolerantes (para no romper si no existen en tu proyecto)
function showNotification(msg, type = 'info') {
// Si tienes un sistema propio, úsalo. Esto es un fallback simple.
console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${msg}`);
try {
    const n = document.getElementById('notification');
    if (n) {
    n.textContent = msg;
    n.className = `notification ${type}`;
    n.style.display = 'block';
    setTimeout(() => (n.style.display = 'none'), 3000);
    }
} catch (_) {}
}
function switchTab(tabId) {
// Ajusta a tu sistema de tabs si lo tienes
const views = document.querySelectorAll('[data-view]');
views.forEach(v => v.classList.add('hidden'));
const t = document.querySelector(`[data-view="${tabId}"]`);
if (t) t.classList.remove('hidden');
}
function showMainApp() {
const app = document.getElementById('mainAppView');
const login = document.getElementById('loginView');
if (app) app.classList.remove('hidden');
if (login) login.classList.add('hidden');
}
function showLogin() {
const app = document.getElementById('mainAppView');
const login = document.getElementById('loginView');
if (app) app.classList.add('hidden');
if (login) login.classList.remove('hidden');
}
/* =========================
Seguridad & Usabilidad: validación y sanitización
========================= */

// Escucha de sesión
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = {
            id: user.uid,
            name: user.displayName || 'Usuario',
            email: user.email || '',
            avatar: user.photoURL || ''
        };

        // Mostrar UI principal si aplica
        if (typeof showMainApp === 'function') showMainApp();

        // Cargar data de Firestore
        if (typeof loadFeed === 'function') loadFeed(); // posts públicos
        if (typeof loadUserPosts === 'function') loadUserPosts(); // del usuario
    } else {
        currentUser = null;

        // Si tienes una pantalla de login
        if (typeof showLogin === 'function') showLogin();

        // (Opcional) Feed público aun sin login
        if (typeof loadFeed === 'function') loadFeed();
    }
});

// Helpers UI tolerantes (para no romper si no existen en tu proyecto)
function showNotification(msg, type = 'info') {
    // Si tienes un sistema propio, úsalo. Esto es un fallback simple.
    console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${msg}`);
    try {
        const n = document.getElementById('notification');
        if (n) {
            n.textContent = msg;
            n.className = `notification ${type}`;
            n.style.display = 'block';
            setTimeout(() => (n.style.display = 'none'), 3000);
        }
    } catch (_) {}
}

function switchTab(tabId) {
    // Ajusta a tu sistema de tabs si lo tienes
    const views = document.querySelectorAll('[data-view]');
    views.forEach((v) => v.classList.add('hidden'));
    const t = document.querySelector(`[data-view="${tabId}"]`);
    if (t) t.classList.remove('hidden');
}

function showMainApp() {
    const app = document.getElementById('mainAppView');
    const login = document.getElementById('loginView');
    if (app) app.classList.remove('hidden');
    if (login) login.classList.add('hidden');
}

function showLogin() {
    const app = document.getElementById('mainAppView');
    const login = document.getElementById('loginView');
    if (app) app.classList.add('hidden');
    if (login) login.classList.remove('hidden');
}


// Sanitiza: elimina etiquetas HTML básicas, normaliza espacios y recorta
function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    const noTags = str.replace(/<[^>]*>/g, '');
    const normalized = noTags
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*\.\s*/g, '. ')
        .trim();
    return normalized;
}

// Valida título y contenido
function validatePostInputs({ title, content }) {
    const errors = [];

    // Sanitiza primero
    const cleanedTitle = sanitizeText(title || '');
    const cleanedContent = sanitizeText(content || '');

    // Longitudes
    if (
        cleanedTitle.length < INPUT_RULES.titleMin ||
        cleanedTitle.length > INPUT_RULES.titleMax
    ) {
        errors.push(
            `El título debe tener entre ${INPUT_RULES.titleMin} y ${INPUT_RULES.titleMax} caracteres.`
        );
    }
    if (
        cleanedContent.length < INPUT_RULES.contentMin ||
        cleanedContent.length > INPUT_RULES.contentMax
    ) {
        errors.push(
            `El relato debe tener entre ${INPUT_RULES.contentMin} y ${INPUT_RULES.contentMax} caracteres.`
        );
    }

    // Caracteres no permitidos (evita posible HTML)
    if (/[<>]/.test(title) || /[<>]/.test(content)) {
        errors.push('No se permiten caracteres "<" o ">".');
    }

    // Anti-spam básico: mismo carácter repetido +10
    if (/(.)\1{10,}/.test(cleanedContent)) {
        errors.push('El relato parece contener texto repetitivo no deseado.');
    }

    return {
        ok: errors.length === 0,
        errors,
        cleaned: { title: cleanedTitle, content: cleanedContent }
    };
}


/* =========================
     Formateo de fechas
     ========================= */
function formatDate(dateOrString) {
    const date = dateOrString instanceof Date ? dateOrString : new Date(dateOrString);
    if (Number.isNaN(date.getTime())) return 'Fecha';
    return date.toLocaleDateString('es-NI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


/* =========================
     Render de tarjetas
     - Ajusta clases/HTML a tu diseño actual
     ========================= */
function createPostElement(post, showActions = false) {
    const postDiv = document.createElement('div');
    postDiv.className = 'relato-card'; // usa tu clase CSS (antes 'post-card')

    const imgHTML = post.image
        ? `<div class="relato-img"><img src="${post.image}" alt="${post.title}"/></div>`
        : '';

    const metaAutor = post.author || post.autor || 'Autor anónimo';
    const fecha = formatDate(post.date || post.createdAt || new Date());

    const actionsHTML = showActions
        ? `
                <div class="relato-actions">
                        <button class="btn small" onclick="editPost('${post.id}')"><i class="fas fa-pen"></i> Editar</button>
                        <button class="btn small danger" onclick="deletePost('${post.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                </div>`
        : '';

    postDiv.innerHTML = `
                ${imgHTML}
                <div class="relato-body">
                <h3 class="relato-title">${post.title || 'Sin título'}</h3>
                <div class="relato-meta">
                        <span><i class="fas fa-user"></i> ${metaAutor}</span>
                        <span><i class="fas fa-calendar"></i> ${fecha}</span>
                        ${post.category ? `<span><i class="fas fa-tag"></i> ${post.category}</span>` : ''}
                </div>
                <p class="relato-content">${post.content || ''}</p>
                ${actionsHTML}
                </div>
        `;
    return postDiv;
}


/* =========================
     AUTH: listener de sesión
     ========================= */
if (firebase?.auth && typeof db !== 'undefined') {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = {
                id: user.uid,
                name: user.displayName || 'Usuario',
                email: user.email || '',
                avatar: user.photoURL || ''
            };
            showMainApp();
            // Cargar vistas
            loadFeed();
            loadUserPosts();
        } else {
            currentUser = null;
            showLogin();
            // Si deseas feed público aun sin login:
            loadFeed();
        }
    });
} else {
    console.warn(
        '⚠️ Firebase Auth o Firestore (db) no está disponible aún. Verifica el orden de scripts.'
    );
}


/* =========================
     CREATE: publicar relato
     ========================= */
async function handlePublish(e) {
    if (e && e.preventDefault) e.preventDefault();

    const titleEl = document.getElementById('postTitle');
    const categoryEl = document.getElementById('postCategory');
    const contentEl = document.getElementById('postContent');
    const imageEl = document.getElementById('postImage');
    const formEl = document.getElementById('publishForm');

    const title = (titleEl?.value || '').trim();
    const category = categoryEl?.value || 'general';
    const content = (contentEl?.value || '').trim();
    const image = (imageEl?.value || '').trim();

    if (!currentUser) {
        showNotification('Debes iniciar sesión para publicar', 'error');
        return;
    }
    if (!title || !content) {
        showNotification('El título y el contenido son obligatorios', 'error');
        return;
    }

    try {
        await db.collection('posts').add({
            title,
            content,
            category,
            image: image || null,
            author: currentUser.name,
            authorId: currentUser.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (formEl) formEl.reset();
        showNotification('¡Historia publicada exitosamente!', 'success');
        switchTab('feed'); // ajusta al id de tu pestaña
    } catch (err) {
        console.error(err);
        showNotification('Error al publicar la historia', 'error');
    }
}

/* =========================
   Seguridad & Usabilidad: validación y sanitización
========================= */

// Reglas mínimas (ajusta a tu criterio)
const INPUT_RULES = {
  titleMin: 5,
  titleMax: 100,
  contentMin: 30,
  contentMax: 3000
};

// Sanitiza: elimina etiquetas HTML básicas, normaliza espacios y recorta
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  const noTags = str.replace(/<[^>]*>/g, '');              
  const normalized = noTags
    .replace(/\s+/g, ' ')                                   
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\.\s*/g, '. ')
    .trim();
  return normalized;
}

// Valida título y contenido
function validatePostInputs({ title, content }) {
  const errors = [];

  // Sanitiza primero
  const cleanedTitle = sanitizeText(title || '');
  const cleanedContent = sanitizeText(content || '');

  // Longitudes
  if (cleanedTitle.length < INPUT_RULES.titleMin || cleanedTitle.length > INPUT_RULES.titleMax) {
    errors.push(`El título debe tener entre ${INPUT_RULES.titleMin} y ${INPUT_RULES.titleMax} caracteres.`);
  }
  if (cleanedContent.length < INPUT_RULES.contentMin || cleanedContent.length > INPUT_RULES.contentMax) {
    errors.push(`El relato debe tener entre ${INPUT_RULES.contentMin} y ${INPUT_RULES.contentMax} caracteres.`);
  }

  // Caracteres no permitidos (evita posible HTML)
  if (/[<>]/.test(title) || /[<>]/.test(content)) {
    errors.push('No se permiten caracteres "<" o ">".');
  }

  // Anti-spam básico: mismo carácter repetido +100
  if (/(.)\1{100,}/.test(cleanedContent)) {
    errors.push('El relato parece contener texto repetitivo no deseado.');
  }

  return {
    ok: errors.length === 0,
    errors,
    cleaned: { title: cleanedTitle, content: cleanedContent }
  };
}



/* =========================
     READ: feed público (tiempo real)
     ========================= */
function loadFeed() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    container.innerHTML = '';
    if (feedUnsub) feedUnsub();

    try {
        feedUnsub = db
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snap) => {
                    container.innerHTML = '';

                    if (snap.empty) {
                        container.innerHTML = `
                                <div style="text-align:center; padding:3rem; color:#64748b;">
                                <i class="fas fa-newspaper" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"></i>
                                <p>No hay publicaciones aún. ¡Sé el primero en compartir una historia!</p>
                                </div>`;
                        return;
                    }

                    snap.forEach((doc) => {
                        const data = doc.data();
                        const post = {
                            id: doc.id,
                            ...data,
                            date: data.createdAt ? data.createdAt.toDate() : new Date()
                        };
                        container.appendChild(createPostElement(post, false));
                    });
                },
                (err) => {
                    console.error(err);
                    showNotification('Error al cargar el feed', 'error');
                }
            );
    } catch (err) {
        console.error(err);
        showNotification('No se pudo suscribir al feed', 'error');
    }
}


/* =========================
     READ: mis publicaciones
     ========================= */
function loadUserPosts() {
    const container = document.getElementById('myPostsContainer');
    if (!container) return;

    container.innerHTML = '';
    if (!currentUser) {
        container.innerHTML = `<p style="text-align:center;">Inicia sesión para ver tus publicaciones.</p>`;
        return;
    }
    if (myPostsUnsub) myPostsUnsub();

    try {
        myPostsUnsub = db
            .collection('posts')
            .where('authorId', '==', currentUser.id)
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snap) => {
                    container.innerHTML = '';

                    if (snap.empty) {
                        container.innerHTML = `
                                <div style="text-align:center; padding:3rem; color:#64748b;">
                                <i class="fas fa-edit" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"></i>
                                <p>No has publicado ninguna historia aún.</p>
                                <button onclick="switchTab('publicar')" class="btn">Crear mi primera publicación</button>
                                </div>`;
                        return;
                    }

                    snap.forEach((doc) => {
                        const data = doc.data();
                        const post = {
                            id: doc.id,
                            ...data,
                            date: data.createdAt ? data.createdAt.toDate() : new Date()
                        };
                        container.appendChild(createPostElement(post, true));
                    });
                },
                (err) => {
                    console.error(err);
                    showNotification('Error al cargar tus publicaciones', 'error');
                }
            );
    } catch (err) {
        console.error(err);
        showNotification('No se pudo suscribir a tus publicaciones', 'error');
    }
}


/* =========================
     UPDATE: abrir modal + guardar cambios
     ========================= */
async function editPost(postId) {
    try {
        const docRef = db.collection('posts').doc(postId);
        const snap = await docRef.get();
        if (!snap.exists) return;

        const p = snap.data();
        // Completa tus campos de modal/forma de edición
        const idEl = document.getElementById('editPostId');
        const titleEl = document.getElementById('editTitle');
        const categoryEl = document.getElementById('editCategory');
        const contentEl = document.getElementById('editContent');
        const imageEl = document.getElementById('editImage');
        const modalEl = document.getElementById('editModal');

        if (idEl) idEl.value = postId;
        if (titleEl) titleEl.value = p.title || '';
        if (categoryEl) categoryEl.value = p.category || 'general';
        if (contentEl) contentEl.value = p.content || '';
        if (imageEl) imageEl.value = p.image || '';

        if (modalEl) modalEl.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        showNotification('Error al abrir la edición', 'error');
    }
}

function closeEditModal() {
    const modalEl = document.getElementById('editModal');
    if (modalEl) modalEl.classList.add('hidden');
}

async function handleEditSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const postId = document.getElementById('editPostId')?.value;
    const title = (document.getElementById('editTitle')?.value || '').trim();
    const category = document.getElementById('editCategory')?.value || 'general';
    const content = (document.getElementById('editContent')?.value || '').trim();
    const image = (document.getElementById('editImage')?.value || '').trim();

    if (!postId) return;

    try {
        await db.collection('posts').doc(postId).update({
            title,
            category,
            content,
            image: image || null
        });
        closeEditModal();
        showNotification('¡Publicación actualizada!', 'success');
    } catch (err) {
        console.error(err);
        showNotification('Error al actualizar', 'error');
    }
}


/* =========================
     DELETE: eliminar post
     ========================= */
async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;
    try {
        await db.collection('posts').doc(postId).delete();
        showNotification('Publicación eliminada', 'info');
    } catch (err) {
        console.error(err);
        showNotification('Error al eliminar', 'error');
    }
}


/* =========================
     Migración (opcional, una sola vez)
     ========================= */
async function migrateLocalToFirestore() {
    const candidates = ['posts', 'relatos', 'historias'];
    let local = null;

    for (const key of candidates) {
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                local = JSON.parse(raw);
            } catch (_) {}
            if (Array.isArray(local)) break;
        }
    }

    if (!Array.isArray(local) || local.length === 0) {
        alert('No se encontraron relatos locales para migrar.');
        return;
    }
    if (!currentUser || !currentUser.id) {
        alert('Debes iniciar sesión antes de migrar.');
        return;
    }

    const normalize = (p) => {
        const title = p.title || p.titulo || 'Sin título';
        const content = p.content || p.contenido || '';
        const category = p.category || p.categoria || 'general';
        const image = p.image || p.imagen || null;
        const author = p.author || p.autor || currentUser.name || 'Usuario';
        const authorId = p.authorId || p.autorId || currentUser.id;
        const createdAtLocal = p.createdAt || p.fecha || p.date || null;

        return {
            title,
            content,
            category,
            image: image || null,
            author,
            authorId,
            createdAt: createdAtLocal
                ? new Date(createdAtLocal)
                : firebase.firestore.FieldValue.serverTimestamp(),
            likes: typeof p.likes === 'number' ? p.likes : 0
        };
    };

    const batchSize = 300;
    const chunks = [];
    for (let i = 0; i < local.length; i += batchSize) chunks.push(local.slice(i, i + batchSize));

    let migrated = 0;
    for (const group of chunks) {
        const batch = db.batch();
        group.forEach((p) => {
            const ref = db.collection('posts').doc();
            batch.set(ref, normalize(p));
        });
        await batch.commit();
        migrated += group.length;
    }

    alert(`Migración completa: ${migrated} relatos subidos a Firestore.`);
    // (Opcional) Limpia localStorage después de validar:
    // localStorage.removeItem('posts'); localStorage.removeItem('relatos'); localStorage.removeItem('historias');
}


/* =========================
     Listeners de formularios (si existen en tu HTML)
     ========================= */
document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publishForm');
    if (publishForm) publishForm.addEventListener('submit', handlePublish);

    const editForm = document.getElementById('editForm');
    if (editForm) editForm.addEventListener('submit', handleEditSubmit);

    const editClose = document.getElementById('editClose');
    if (editClose) editClose.addEventListener('click', closeEditModal);
});

// === LOGIN con Google ===
document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await firebase.auth().signInWithPopup(provider);
            } catch (e) {
                console.error(e);
                showNotification('No se pudo iniciar sesión con Google', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
            } catch (e) {
                console.error(e);
                showNotification('No se pudo cerrar sesión', 'error');
            }
        });
    }

    // === Tabs ===
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-content');

    function activateTab(tabId) {
        tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
        tabSections.forEach((s) => s.classList.toggle('active', s.id === tabId));

        // Cargas perezosas
        if (tabId === 'feed' && typeof loadFeed === 'function') loadFeed();
        if (tabId === 'mis-publicaciones' && typeof loadUserPosts === 'function') loadUserPosts();
    }

    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // Tab por defecto
    activateTab('feed');

    // === Actualiza datos del usuario en el header cuando haya sesión ===
    if (firebase?.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            const avatar = document.getElementById('userAvatar');
            const nameEl = document.getElementById('userName');

            if (user) {
                if (avatar) avatar.src = user.photoURL || 'https://via.placeholder.com/32x32/4F46E5/FFFFFF?text=U';
                if (nameEl) nameEl.textContent = user.displayName || 'Usuario';
            } else {
                if (avatar) avatar.src = 'https://via.placeholder.com/32x32/4F46E5/FFFFFF?text=U';
                if (nameEl) nameEl.textContent = 'Usuario';
            }
        });
    }
});
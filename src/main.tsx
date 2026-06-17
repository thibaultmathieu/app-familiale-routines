import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Mise à jour fiable de la PWA, y compris en icône « écran d'accueil » iOS.
// Le service worker est en mode autoUpdate (skipWaiting + clientsClaim), mais
// deux trous le bloquent sur iOS installé : (1) une icône iOS ne revérifie jamais
// le réseau d'elle-même et reste figée sur sa version en cache ; (2) le script
// d'enregistrement par défaut ne recharge pas la page quand le nouveau SW prend
// la main. On comble les deux : on vérifie les mises à jour au retour au premier
// plan + une fois par heure, et on recharge une seule fois quand le nouveau
// service worker prend le contrôle.
// (Les données des enfants vivent dans localStorage, jamais touché par tout ça.)
if ('serviceWorker' in navigator) {
  // Au tout premier install il n'y a pas encore de contrôleur : on n'enclenche
  // le rechargement que pour une vraie mise à jour (évite un reload au 1er lancement).
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return
    reloading = true
    window.location.reload()
  })

  const checkForUpdate = () => {
    if ('onLine' in navigator && !navigator.onLine) return
    navigator.serviceWorker.getRegistration()
      .then(reg => reg?.update())
      .catch(() => { /* hors-ligne ou pas encore enregistré : on réessaiera */ })
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
  window.addEventListener('focus', checkForUpdate)
  // Filet pour une app laissée ouverte longtemps (la tablette du salon)
  setInterval(checkForUpdate, 60 * 60 * 1000)
}

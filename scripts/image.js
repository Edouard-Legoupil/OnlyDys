/**
 * Recherche le meilleur pictogramme ARASAAC pour un mot donné
 * et retourne l'URL de l'image (en taille 500x500 pixels, fond transparent).
 *
 * @param {string} word Le mot à rechercher (ex: "chien", "courir", "pomme").
 * @returns {Promise<string|null>} L'URL complète du pictogramme ou null si aucun résultat n'est trouvé.
 */
async function getPictogramUrl(word) {
    // 1. Définition de l'API de base
    const API_BASE_URL = 'https://api.arasaac.org/api/pictograms/';

    // 2. Définition des paramètres de recherche
    // lang=fr : Langue de recherche (français)
    // searchText : Le mot recherché
    const lang = 'fr';
    const searchText = encodeURIComponent(word.trim().toLowerCase());

    const searchUrl = `${API_BASE_URL}${lang}/search/${searchText}`;

    try {
        // 3. Appel de l'API
        const response = await fetch(searchUrl);

        if (!response.ok) {
            // Gérer les erreurs de réponse HTTP (ex: 404, 500)
            console.error(`Erreur HTTP lors de la recherche du mot "${word}" : ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        // 4. Vérification et traitement des résultats
        if (data && data.length > 0) {
            // Le "meilleur match" est généralement le premier élément du tableau
            const bestMatch = data[0];

            // Construction de l'URL de l'image
            // Le champ 'url' dans l'objet retourné est généralement le nom de fichier.
            // Le format standard pour les images 500x500 est :
            // https://static.arasaac.org/pictograms/<id>/<id>_500.png

            const pictogramId = bestMatch._id;

            // On utilise la taille standard (500x500) pour une bonne qualité
            const imageUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_500.png`;

            return imageUrl;
        } else {
            console.log(`Aucun pictogramme trouvé pour le mot : "${word}"`);
            return null;
        }

    } catch (error) {
        // Gérer les erreurs réseau ou de parsing JSON
        console.error(`Erreur lors de l'appel à l'API ARASAAC pour "${word}" :`, error);
        return null;
    }
}

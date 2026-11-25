# QCM Réseau

Petite application web pour s'entraîner à un QCM de réseau, en français.
Les réponses ne sont jamais affichées avant l'envoi du test.

## Lancer l'application

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev        # serveur de développement : http://localhost:5173
```

Autres commandes :

```bash
npm run build      # vérification TypeScript + build de production (dist/)
npm run preview    # servir le build de production
npm test           # tests unitaires (Vitest)
```

## Utilisation

- **Naviguer entre les pages** (5 questions par page) : glisser horizontalement sur tactile,
  touches ← / → du clavier (hors champs de saisie et listes déroulantes), boutons « Précédent » / « Suivant »,
  ou les numéros de page.
- **Progression** : la barre et le texte « x / 31 questions répondues » sont mis à jour à chaque réponse.
  Les pages dont toutes les questions ont une réponse sont mises en évidence.
- **Terminer le test** : une fenêtre liste les questions restées sans réponse (cliquez sur un numéro pour y aller),
  puis « Envoyer ».
- **Sauvegarde** : les réponses et la page courante sont enregistrées dans le stockage local du navigateur.
  Un rechargement de la page ne fait rien perdre.
- **Résultats** : points, note sur 20, pourcentage, et nombre de réponses correctes / partielles / incorrectes.
  « Revoir mes réponses » affiche la correction ; « Seulement mes erreurs » filtre la liste.
- **Recommencer** efface l'essai enregistré (après confirmation). L'option « Mélanger les réponses »
  (désactivée par défaut) s'applique au nouvel essai.

## Données

Les questions sont dans `src/data/questions.json` (format décrit dans la clé `schema` du fichier).
Types pris en charge : `single`, `multiple`, `match`, `order`.

## Calcul des points

Logique pure dans `src/lib/scoring.ts`, couverte par `src/lib/scoring.test.ts`
(1 point par question, total ramené sur 20). Les tests utilisent des questions fictives.

## Structure

```
src/
  components/   écrans et composants (quiz, résultats, revue, modale, pagination)
  hooks/        navigation clavier
  lib/          scoring, mélange, texte enrichi, stockage, formatage (fonctions pures testées)
  data/         questions.json
```

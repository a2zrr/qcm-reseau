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

Deux QCM sont disponibles, chacun avec sa propre progression, ses résultats, sa revue et son réglage
« Mélanger les réponses » : **QCM Réseau 2021** (31 questions) et **QCM Réseau 2019** (18 questions).
L'accueil liste les deux (nombre de questions, état : pas commencé / en cours / terminé avec la note).
Depuis un QCM, le lien « Changer de QCM » revient à l'accueil. Le choix du QCM est dans l'adresse
(`#2021`, `#2019`, `#accueil`) : l'adresse `/` reste la même.

- **Naviguer entre les pages** (5 questions par page) : glisser horizontalement sur tactile,
  touches ← / → du clavier (hors champs de saisie et listes déroulantes), boutons « Précédent » / « Suivant »,
  ou les numéros de page.
- **Progression** : la barre et le texte « x / 31 questions répondues » sont mis à jour à chaque réponse.
  Les pages dont toutes les questions ont une réponse sont mises en évidence.
- **Terminer le test** : une fenêtre liste les questions restées sans réponse (cliquez sur un numéro pour y aller),
  puis « Envoyer ».
- **Sauvegarde** : les réponses et la page courante sont enregistrées dans le stockage local du navigateur.
  Un rechargement de la page ne fait rien perdre. Chaque QCM a sa propre clé de stockage
  (`qcm-reseau:attempt` pour 2021, `qcm-reseau:attempt-2019` pour 2019).
- **Résultats** : points, note sur 20, pourcentage, et nombre de réponses correctes / partielles / incorrectes.
  « Revoir mes réponses » affiche la correction ; « Seulement mes erreurs » filtre la liste.
- **Recommencer** efface l'essai enregistré (après confirmation). L'option « Mélanger les réponses »
  (désactivée par défaut) s'applique au nouvel essai.

## Données

Les questions sont dans `src/data/questions.json` (QCM 2021) et `src/data/questions-2019.json` (QCM 2019),
au même format (décrit dans la clé `schema` de chaque fichier). La liste des QCM est dans `src/lib/quizzes.ts`.
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
  data/         questions.json (2021), questions-2019.json (2019)
```

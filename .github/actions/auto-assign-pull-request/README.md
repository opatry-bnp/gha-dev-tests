
# Auto Assign Pull Request GitHub Action :mechanical_arm:

A l'ouverture d'une PR, cette action va automatiquement :
- **vérifier** si la pull request n'est pas en **draft** (sinon on attendra qu'elle soit ouverte à la review). Attention, on parle du statut de draft, et non du label.
- **vérifier** si la pull request n'est pas en **report** (basé sur son label). Dans ce cas, il faudra ajouter les reviewers à la main.
- **vérifier** si l'auteur a déjà affecté des reviewers (dans ce cas, l'ajout est ignoré)

Si toutes les conditions sont remplies, alors :
- on tire **au hasard** un reviewer dans la squad de l'auteur de la PR (si il n'y a aucun autre reviewer dans la squad de l'auteur, ou si l'auteur n'est pas renseigné, on assignera deux reviewers hors de la squad).
- on tire **au hasard** un reviewer hors de la squad de l'auteur de la PR (en retirant le reviewer déjà assigné le cas échéant).
- on ajoute les deux heureux élus en tant que **reviewers**

# Mise à jour de la liste des reviewers

A chaque arrivée ou départ de l'équipe, on doit mettre à jour la liste des reviewers qui se trouve dans le fichier `index.js`, à la ligne 18.
Les collaborateurs doivent avoir fait au moins un commit sur le projet pour pouvoir être ajoutés.

# Gestion des erreurs

Si un quelconque problème a lieu lors de l'exécution de cette Action, aucun reviewer n'est ajouté à la PR.
En cliquant sur un workflow depuis l'onglet _"Actions"_, on peut voir les logs de l'exécution de celui-ci ce qui permet notamment de voir quelle est la cause du non-ajout des reviewers.

# Branchement

Cette action doit être référencée au sein d'un fichier `.github/workflows/auto_assign_pull_request.yml` de la façon suivante :

```
name: Auto-Assign

on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  Auto-assign-pull-requests:
    runs-on: ubuntu-latest
    name: Auto-assign reviewers to pull-request
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/auto-assign-pull-request
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}
```

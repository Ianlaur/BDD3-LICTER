# Requirements — Zara Social Data Intelligence

## Program

**Eugenia School × Licter — BDD Social Data Intelligence 2026**

> "BDD Eugenia School × Licter — Édition 2026. Prouvez qu'un Data/Business Analyst armé des bons outils peut extraire des insights d'or à partir des données sociales."

---

## Problématique Centrale

> Une marque génère chaque jour des centaines de signaux : avis clients, mentions sociales, comparatifs concurrentiels. Comment les structurer, les analyser et les synthétiser pour qu'ils deviennent une arme stratégique pour ses décideurs ?

**Cas pratique :** BRAND & MARKET INTELLIGENCE — Analyse 360° : Réputation, Concurrence et Expérience Client

---

## Contexte

- Chaque groupe travaille sur une marque différente (tirée au sort) issue du dataset fourni
- Notre marque : **Zara** (Inditex Group)
- Un fichier Excel sectoriel (3 onglets) est fourni comme base de données initiale
- L'objectif est d'automatiser l'ajout (append) de flux de données récents à cette base existante
- Les données sociales sont fictives (mentions, avis clients, comparatifs concurrentiels)
- Mission : les transformer en intelligence business actionnable pour un COMEX

---

## Stack Technique Imposée

| Composant | Outil | Rôle | Obligatoire |
|-----------|-------|------|-------------|
| Données initiales | Fichier Excel (3 onglets) | Base historique | Oui |
| Extraction | **Apify** | Extraction continue (scraping) | Oui |
| Orchestration | **N8N** | Chef d'orchestre des workflows | **OUI — IMPOSÉ** |
| IA / Analyse | **OpenAI API** | Moteur d'analyse et traitement IA | Oui |
| Base de données | **Supabase** | Stockage structuré | Oui |
| Dashboard | **Antigravity** | Visualisation et KPIs | Oui |
| Autres | Libre choix | Compléments au besoin | Non |

---

## Sources de Données Ciblées

| Source | Type |
|--------|------|
| TikTok | Posts, mentions, hashtags, UGC |
| Instagram | Posts, stories, mentions, hashtags |
| LinkedIn | Posts, perception marque, signaux employeur |
| Reddit | Threads, discussions, mentions |
| Trustpilot | Avis et scores de réputation |
| Glassdoor | Avis employés, perception employeur |
| Google Reviews | Avis clients par magasin |

---

## Rendus Journaliers (J1 → J5)

> "Chaque jour a son objectif et son livrable intermédiaire. Le jury évaluera votre progression."

### J1 — Feuille de Route
- **Format :** Gestion de projet
- **Contenu :** Nomination du Chef de projet, garant des délais et de la communication. Création d'une feuille de route détaillant les grandes étapes, la répartition des tâches et les objectifs journaliers. Utiliser le gestionnaire de tâches de votre choix.

### J2 — Cartographie du Projet (Mapping)
- **Format :** Schéma visuel (Miro, FigJam…)
- **Contenu :** Un schéma modélisant le parcours de la donnée : sources ciblées, outils d'extraction et d'automatisation envisagés, et comment la donnée finale est stockée avant d'être exploitée.

### J3 — V1 du Dashboard
- **Format :** Dashboard interactif
- **Contenu :** Première version fonctionnelle du dashboard sur Antigravity avec les données nettoyées et les premiers KPIs.

### J4 — Preuve d'Automatisation
- **Format :** Vidéo Loom
- **Contenu :** Le flux est 100% opérationnel : le contenu est récupéré à la source, traité par le système d'automatisation, et mis à jour sur le Dashboard sans intervention manuelle. Démonstration finale.

### J5 — Pitch & Présentation COMEX
- **Format :** Soutenance finale
- **Contenu :** Présentation des insights stratégiques devant un jury de 4 professionnels. Vous devez convaincre que votre solution apporte de la valeur business.

---

## Livrables Finaux

> "4 livrables finaux qui démontrent votre maîtrise du pipeline et votre capacité d'analyse."

### 01 — Cartographie du Projet
- **Format :** Schéma visuel (Miro / FigJam)
- **Contenu :** Pipeline complet de l'extraction au stockage

### 02 — Dashboard Antigravity
- **Format :** Dashboard interactif
- **Contenu :** Dashboards de KPIs, graphiques interactifs, pilotage en temps réel. Vues claires, bons KPIs, donnée lisible.

### 03 — Magazine Exécutif
- **Format :** PDF (5 pages max)
- **Contenu :** Un document autonome visuel et synthétique, pensé pour être lu par la Direction.

### 04 — Présentation PPT
- **Format :** Support de soutenance
- **Contenu :** Défense du projet, présentation des insights stratégiques et démonstration.

---

## Critères d'Évaluation

> "Voici comment votre travail sera évalué par le jury."

| Critère | Poids |
|---------|-------|
| Pertinence des insights | **30%** |
| Maîtrise technique du pipeline | **25%** |
| Qualité du dashboard | **20%** |
| Storytelling & recommandations | **15%** |
| Qualité du magazine | **10%** |

---

## Valeur Métier — Ce que ce Hackathon Entraîne

### Synthèse de Signaux Complexes
La compétence rare, ce n'est pas d'avoir accès aux données, c'est de les synthétiser. Réduire 1 500 lignes de verbatims en 3 insights actionnables que le COMEX peut lire en 2 minutes.

### Automatisation de l'Intelligence
Construire des pipelines autonomes qui alimentent en continu votre base de connaissance. Un réflexe recherché dans tous les pôles Data, Marketing, et Stratégie.

### Insights Forts
Un insight "fort", c'est un signal actionnable. "Le NPS de notre SAV chute de 40% les lundis matins sur Trustpilot" en est un.

### Storytelling COMEX
La donnée sans narration ne vaut rien. Savoir transformer un chiffre complexe en un récit convaincant pour des décideurs non-techniques.

---

## Conseils pour Réussir

1. Ne scrapez pas tout depuis zéro : Apify ne sert qu'à automatiser le flux de nouvelles données
2. Ne scrapez pas tout aveuglément : 500 avis pertinents > 50 000 non filtrés
3. Ne faites pas de dashboard "sapin de Noël" : chaque graphique doit répondre à une question
4. Ne négligez pas le magazine : c'est le livrable "COMEX"
5. N'oubliez pas la vidéo Loom : indispensable pour la validation technique
6. Pensez "COMEX" : vos insights doivent être actionnables, pas académiques
7. Automatisez d'abord, embellissez ensuite : pipeline autonome > beau dashboard statique
8. Partez du fichier Excel : ne perdez pas 2 jours à scraper 10 ans d'historique
9. Documentez vos choix : pourquoi ces KPIs ? Pourquoi ces sources ?

---

## Question Guide

> « Si un membre du COMEX n'a que 2 minutes, est-ce que mon dashboard et mon magazine lui permettent de prendre une décision ? »

---

## Récompenses

- **Pitch chez Licter** — Présenter le projet dans les locaux, échanger avec des experts Social Data du CAC 40
- **Invitation événement Licter** — Événement exclusif

---

## Pipeline Flow Résumé

```
[Excel 3 onglets]  →  [Apify Actors]  →  [N8N Workflows]  →  [OpenAI API]  →  [Supabase]  →  [Antigravity Dashboard]
    Base historique     Extraction        Orchestration       IA/Analyse       Stockage        Visualisation
                        continue          (OBLIGATOIRE)
```

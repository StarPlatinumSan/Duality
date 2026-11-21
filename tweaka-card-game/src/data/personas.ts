export type PersonaAbilityBlock = {
	label?: string;
	text?: string;
	items?: string[];
	italic?: boolean;
};

export type PersonaAbility = {
	kind: "Passif" | "Capacité 1" | "Capacité 2" | "Ultime";
	name: string;
	cost?: string;
	blocks: PersonaAbilityBlock[];
};

export type Persona = {
	name: string;
	health: number;
	tweak: number;
	abilities: PersonaAbility[];
	placeholder?: boolean;
};

export const personas: Persona[] = [
	{
		name: "Paul",
		health: 180,
		tweak: 2,
		abilities: [
			{
				kind: "Passif",
				name: "Amateur de toppes",
				blocks: [
					{
						text: "Paul aime les toppes. Au début de chacun de ses tours, il régénère 10 PV.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Sang de Marseille",
				cost: "3 Tweak",
				blocks: [
					{
						text: "Inflige 15 dégâts aux deux Personas adverses. Il pioche ensuite une réaction dans le deck adverse et la met dans la défausse sans l'utiliser.",
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Photographe",
				cost: "2 Tweak",
				blocks: [
					{
						text: "Paul attire l'attention sur lui. Il s'applique Tunnel. Pendant le prochain tour adverse, l'ennemi doit cibler Paul avec ses attaques.",
					},
				],
			},
			{
				kind: "Ultime",
				name: "L'Homme Toppe",
				blocks: [
					{ text: "Paul allume sa meilleure toppe.", italic: true },
					{
						text: "Restaure 100 % de ses PV et pioche 2 cartes Réaction, qu'il joue immédiatement.",
					},
					{
						text: "Cet ultime peut être utilisé en réaction lorsque Paul meurt.",
					},
				],
			},
		],
	},
	{
		name: "Andrei",
		health: 200,
		tweak: 5,
		abilities: [
			{
				kind: "Passif",
				name: "Alcohol Immunity",
				blocks: [
					{ text: "Andrei est Immunisé aux effets de l'alcool." },
					{
						text: "Lorsque ses PV atteignent 50 % ou moins (100 PV), il ne subit plus que 50 % des dégâts reçus.",
					},
					{
						text: "De plus, Tweak Créatif lance désormais 3d6 au lieu de 2d6.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Fever",
				cost: "3 Tweak",
				blocks: [
					{ text: "Andrei lance une pièce pour déterminer sa cible :" },
					{
						items: ["Pile : Persona adverse de gauche.", "Face : Persona adverse de droite."],
					},
					{
						text: "Inflige 25 dégâts, plus 10 dégâts supplémentaires pour chaque carte Pisse par terre présente dans la défausse.",
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Tweak Créatif",
				cost: "6 Tweak",
				blocks: [
					{
						text: "Andrei lance 2d6 et récupère autant de Tweak que le résultat pour le tour en cours.",
					},
					{
						text: "Il cible ensuite un Persona adverse et lui inflige des dégâts équivalents au double du résultat.",
					},
					{ label: "Passif actif", text: "Lance 3d6 à la place." },
				],
			},
			{
				kind: "Ultime",
				name: "Incident",
				blocks: [
					{
						text: "Andrei libère toute sa créativité pour écrire des horreurs psychiquement insoutenables.",
						italic: true,
					},
					{
						text: "Toutes les cartes sur le terrain, sauf Andrei, subissent 30 dégâts.",
					},
					{
						text: "Après application des dégâts, toute carte, incluant Andrei, possédant 50 PV ou moins est instantanément éliminée.",
					},
				],
			},
		],
	},
	{
		name: "Samuel",
		health: 100,
		tweak: 4,
		abilities: [
			{
				kind: "Passif",
				name: "QUOIII",
				blocks: [
					{
						text: "Lorsque Samuel est éliminé, au début du prochain tour, lance 1d6 :",
					},
					{
						items: ["1-3 : Aucun effet.", "4 : Revient à la vie avec 1 PV.", "5 : Revient à la vie avec 50 PV.", "6 : Revient à la vie avec 100 PV."],
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Suceur des maths",
				cost: "3 Tweak",
				blocks: [
					{ text: "Samuel inflige 10 dégâts à un Persona de son choix." },
					{
						text: "Chaque utilisation augmente les dégâts de cette capacité de 5 points supplémentaires.",
					},
					{ label: "Progression", text: "10, 15, 20, 25, 30..." },
				],
			},
			{
				kind: "Capacité 2",
				name: "Santé !",
				cost: "2 Tweak",
				blocks: [
					{
						text: "Samuel chug sa bière et la lance, infligeant 20 dégâts à un Persona adverse de son choix.",
					},
					{
						text: "Il peut ensuite choisir de lancer une pièce une fois :",
					},
					{
						items: ["Pile : Inflige 40 dégâts supplémentaires à sa cible.", "Face : Subit lui-même 20 dégâts."],
					},
					{ text: "Le lancer de pièce est facultatif." },
				],
			},
			{
				kind: "Ultime",
				name: "Mush Live",
				blocks: [
					{ text: "Samuel pop son meilleur mush.", italic: true },
					{ text: "Pendant ce tour, toutes ses capacités coûtent 0 Tweak." },
					{
						label: "Suceur des maths",
						text: "Peut être utilisé sans limite de fois. Après la première utilisation, Samuel subit autant de dégâts que ceux infligés à sa cible.",
					},
					{
						label: "Santé !",
						text: "Samuel peut relancer la pièce autant de fois qu'il le souhaite, jusqu'à obtenir Face. Chaque Pile inflige 20 dégâts supplémentaires à sa cible. Le premier Face inflige 20 dégâts à Samuel et met fin aux lancers.",
					},
				],
			},
		],
	},
	{
		name: "Oscar",
		health: 130,
		tweak: 1,
		abilities: [
			{
				kind: "Passif",
				name: "Renard",
				blocks: [
					{
						text: "Une fois par partie, Oscar peut activer ce passif en réaction à une attaque ou une capacité qui le touche. Il annule intégralement les dégâts de cette attaque ou capacité.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Petit Prince",
				cost: "1 Tweak",
				blocks: [
					{ text: "Oscar choisit l'un des deux effets :" },
					{
						items: ["Option 1 : Inflige 10 dégâts à toutes les cartes sur le terrain, y compris lui-même et son allié.", "Option 2 : Récupère 10 PV et soigne également un Persona adverse de son choix de 10 PV."],
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Lapin",
				cost: "10 Tweak",
				blocks: [
					{
						text: "Oscar effectue un saut de lapin sur un Persona de son choix, lui infligeant 50 dégâts.",
					},
				],
			},
			{
				kind: "Ultime",
				name: "Voyageur",
				blocks: [
					{ text: "Oscar part en voyage.", italic: true },
					{
						text: "Si son allié est Inerte, il redevient immédiatement Actif et retrouve l'accès à toutes ses capacités.",
					},
				],
			},
		],
	},
	{
		name: "Jad",
		health: 160,
		tweak: 3,
		abilities: [
			{
				kind: "Passif",
				name: "Shot de Tweaka",
				blocks: [
					{
						text: "Par manque de social cues, Jad est Immunisé à tous les effets des cartes Réaction.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Le goat au-dessus des goats",
				cost: "Coût variable",
				blocks: [
					{
						text: "Jad veut se faire accepter, alors il imite les autres.",
						italic: true,
					},
					{
						text: "Jad peut copier et utiliser n'importe quelle capacité d'un Persona actuellement en jeu.",
					},
					{
						text: "Le coût de la capacité copiée est augmenté de +1 Tweak.",
					},
					{ label: "Coût final", text: "Coût original +1 Tweak." },
				],
			},
			{
				kind: "Capacité 2",
				name: "Vape Master",
				cost: "5 Tweak",
				blocks: [
					{
						text: "Jad vape tellement qu'il finit par se faire complètement oublier. Il devient Impossible à cibler pendant 1 tour.",
					},
				],
			},
			{
				kind: "Ultime",
				name: "Grape",
				blocks: [
					{
						text: "Jad ruine tous les efforts qu'il a fournis pour glow up.",
						italic: true,
					},
					{ label: "Allié", text: "Inflige 60 dégâts à son propre partenaire." },
					{
						label: "Adversaires",
						text: "Les deux Personas adverses sont étourdis (STUN) pendant 2 tours.",
					},
					{
						label: "Interaction spéciale",
						text: "Si Xi est présente dans la partie, elle est Instantanément éliminée.",
					},
				],
			},
		],
	},
	{
		name: "Xi",
		health: 140,
		tweak: 1,
		abilities: [
			{
				kind: "Passif",
				name: "Jaune",
				blocks: [
					{ text: "Chaque fois que Xi subit des dégâts, elle gagne 1 Tweak." },
					{
						text: "Si les dégâts proviennent d'Andrei, elle gagne plutôt 2 Tweak.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Jing",
				cost: "1 Tweak",
				blocks: [{ text: "Xi inflige 10 dégâts." }],
			},
			{
				kind: "Capacité 2",
				name: "Ping",
				cost: "2 Tweak",
				blocks: [
					{
						text: "Xi lance 4d6 et inflige une rafale de dégâts équivalente à la somme des quatre dés.",
					},
					{
						text: "Elle récupère ensuite autant de PV que de dégâts infligés.",
					},
					{ label: "Dégâts et soins", text: "4 à 24 PV." },
				],
			},
			{
				kind: "Ultime",
				name: "HONG KONG",
				blocks: [
					{
						text: "Xi possède une banque de crédits commençant à 10 crédits.",
					},
					{
						text: "Au début de chacun de ses tours, elle accumule 10 crédits supplémentaires.",
					},
					{
						text: "Lorsqu'elle active son ultime, Xi dépense tous ses crédits, qu'elle peut répartir librement entre :",
						items: ["Dégâts : 1 crédit pour 1 dégât.", "Soins : 1 crédit pour 1 PV restauré."],
					},
					{
						label: "Interaction spéciale",
						text: "Si Xi est éliminée par l'ultime GRAPE XI de Jad, elle peut tout de même activer HONG KONG en réaction et dépenser ses crédits accumulés.",
					},
				],
			},
		],
	},
	{
		name: "Marion",
		health: 170,
		tweak: 0,
		abilities: [
			{
				kind: "Passif",
				name: "Inventaire étendu",
				blocks: [
					{
						text: "Marion permet à son équipe de disposer d'un 4e emplacement d'objet dans son deck, au lieu des 3 habituels.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Râle",
				cost: "2 Tweak",
				blocks: [
					{ text: "Marion inflige 5 dégâts à une cible." },
					{
						text: "Les dégâts augmentent de 5 points pour chaque carte Réaction actuellement présente sur le terrain, alliée ou adverse.",
					},
					{
						label: "Si son allié meurt",
						items: ["Coût réduit à 0 Tweak.", "Chaque utilisation coûte désormais 10 PV.", "Les dégâts finaux de la capacité sont doublés."],
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Comas éthylique",
				cost: "15 Tweak",
				blocks: [
					{
						text: "Marion choisit un Persona adverse et supprime une de ses capacités ou son passif. En contrepartie, Marion subit STUN pendant 1 tour.",
					},
				],
			},
			{
				kind: "Ultime",
				name: "Négativité",
				blocks: [
					{
						text: "Marion libère toute sa négativité dans un râlage insupportable.",
						italic: true,
					},
					{
						text: "Toutes les autres cartes sur le terrain, alliées comme adverses, subissent des dégâts psychiques équivalents à 50 % de leurs PV restants.",
					},
					{ text: "Marion n'est pas affectée." },
				],
			},
		],
	},
	{
		name: "Yan",
		health: 110,
		tweak: 3,
		abilities: [
			{
				kind: "Passif",
				name: "Impulsive Thinking",
				blocks: [
					{
						text: "Yan débloque un 3e emplacement de Réaction pour son équipe, au lieu de 2 habituels.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Far-right Punch",
				cost: "3 Tweak",
				blocks: [
					{
						text: "Yan inflige des dégâts équivalents à 50 % de ses PV manquants.",
					},
					{
						label: "Exemple",
						text: "À 50 PV sur 110, il lui manque 60 PV. Il inflige donc 30 dégâts.",
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Raving",
				cost: "4 Tweak",
				blocks: [
					{
						items: ["Yan inflige 20 dégâts à chacun des deux Personas adverses.", "OU : Yan inflige 30 dégâts au Persona de son choix."],
					},
					{ text: "Il s'applique ensuite l'effet Tunnel." },
				],
			},
			{
				kind: "Ultime",
				name: "Republicanism",
				blocks: [
					{ text: "Yan sacrifie tous les objets de son équipe." },
					{
						text: "En échange, il ressuscite son allié avec 100 % de ses PV.",
					},
				],
			},
		],
	},
	{
		name: "Alain",
		health: 0,
		tweak: 0,
		abilities: [],
		placeholder: true,
	},
	{
		name: "Jesus",
		health: 150,
		tweak: 3,
		abilities: [
			{
				kind: "Passif",
				name: "Sous la moitié des PV",
				blocks: [
					{
						text: "Lorsque Jesus est en dessous de la moitié de ses PV, il inflige 10 dégâts supplémentaires.",
					},
				],
			},
			{
				kind: "Capacité 1",
				name: "Gambling's Power",
				cost: "3 Tweak",
				blocks: [
					{ text: "Jesus lance 1d6 pour déterminer sa cible :" },
					{
						items: ["1-2 : Inflige 35 dégâts à son allié, s'il est encore en vie.", "3-4 : Inflige 35 dégâts au Persona adverse de gauche.", "5-6 : Inflige 35 dégâts au Persona adverse de droite."],
					},
				],
			},
			{
				kind: "Capacité 2",
				name: "Jexa's Will",
				cost: "8 Tweak",
				blocks: [
					{
						text: "Jesus s'inflige 20 dégâts et détruit 1 objet adverse.",
					},
				],
			},
			{
				kind: "Ultime",
				name: "Tarzan's Soul",
				blocks: [
					{
						text: "Pendant les 5 prochains tours, Jesus a 50 % de chances d'être immunisé à tous les dégâts à chaque tour.",
					},
					{
						text: "De plus, lorsqu'il obtient un 6 au lancer de 1d6 de Gambling's Power, il choisit sa cible et lui inflige 70 dégâts à la place.",
					},
				],
			},
		],
	},
	{
		name: "Gabriel",
		health: 0,
		tweak: 0,
		abilities: [],
		placeholder: true,
	},
	{
		name: "Jake",
		health: 0,
		tweak: 0,
		abilities: [],
		placeholder: true,
	},
];

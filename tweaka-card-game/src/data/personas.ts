export type AbilityKind = "passive" | "ability1" | "ability2" | "ultimate";
export type PersonaSubclass = "tank" | "dps" | "assassin" | "support";
export type CostResource = "tweak" | "eyes";

export type PersonaCost = {
	amount: number;
	resource: CostResource;
};

export type PersonaDefinition = {
	id: string;
	asset: string;
	name: string;
	subclass: PersonaSubclass;
	classOrder: number;
	health: number;
	tweak: number;
	costs?: Partial<Record<AbilityKind, PersonaCost>>;
	becomesInert?: boolean;
	placeholder?: boolean;
};

const tweak = (amount: number): PersonaCost => ({ amount, resource: "tweak" });
const eyes = (amount: number): PersonaCost => ({ amount, resource: "eyes" });

// Single source of truth for non-translated Persona data.
// Edit stats, classes, ordering and numeric ability costs here.
export const personaDefinitions: PersonaDefinition[] = [
	{
		id: "andrei",
		asset: "Andrei",
		name: "Andrei",
		subclass: "tank",
		classOrder: 0,
		health: 400,
		tweak: 5,
		costs: { ability1: tweak(3), ability2: tweak(10) },
	},
	{
		id: "paul",
		asset: "Paul",
		name: "Paul",
		subclass: "tank",
		classOrder: 1,
		health: 350,
		tweak: 2,
		costs: { ability1: tweak(3), ability2: tweak(2) },
	},
	{
		id: "samuel",
		asset: "Samuel",
		name: "Samuel",
		subclass: "assassin",
		classOrder: 0,
		health: 200,
		tweak: 4,
		costs: { ability1: tweak(3), ability2: tweak(2) },
	},
	{
		id: "oscar",
		asset: "Oscar",
		name: "Oscar",
		subclass: "support",
		classOrder: 0,
		health: 250,
		tweak: 1,
		costs: { ability1: tweak(1), ability2: tweak(5) },
	},
	{
		id: "jad",
		asset: "Jad",
		name: "Jad",
		subclass: "support",
		classOrder: 1,
		health: 280,
		tweak: 3,
		costs: { ability2: tweak(5) },
	},
	{
		id: "marion",
		asset: "Marion",
		name: "Marion",
		subclass: "dps",
		classOrder: 2,
		health: 270,
		tweak: 1,
		costs: { ability1: tweak(2), ability2: tweak(15) },
	},
	{
		id: "xi",
		asset: "Xi",
		name: "Xi",
		subclass: "dps",
		classOrder: 1,
		health: 240,
		tweak: 1,
		costs: { ability1: tweak(1), ability2: tweak(2) },
	},
	{
		id: "yan",
		asset: "Yan",
		name: "Yan",
		subclass: "assassin",
		classOrder: 1,
		health: 220,
		tweak: 3,
		costs: { ability1: tweak(2), ability2: tweak(4) },
	},
	{
		id: "jesus",
		asset: "Jesus",
		name: "Jesus",
		subclass: "dps",
		classOrder: 0,
		health: 300,
		tweak: 3,
		costs: { ability1: tweak(3), ability2: tweak(8) },
	},
	{
		id: "gabriel",
		asset: "Gabriel",
		name: "Gabriel",
		subclass: "tank",
		classOrder: 2,
		health: 380,
		tweak: 1,
		costs: { ability1: eyes(5), ability2: tweak(5), ultimate: eyes(20) },
		becomesInert: false,
	},
	{
		id: "jake",
		asset: "Jake",
		name: "Jake",
		subclass: "tank",
		classOrder: 3,
		health: 440,
		tweak: 5,
		costs: { ability1: tweak(5), ability2: tweak(9) },
	},
	{
		id: "victor",
		asset: "Victor",
		name: "Victor",
		subclass: "dps",
		classOrder: 3,
		health: 300,
		tweak: 3,
		costs: { ability1: tweak(3), ability2: tweak(4) },
	},
	{
		id: "kenny",
		asset: "Kenny",
		name: "Kenny",
		subclass: "assassin",
		classOrder: 2,
		health: 240,
		tweak: 3,
		costs: { ability1: tweak(4), ability2: tweak(9) },
	},
	{
		id: "tom",
		asset: "Tom",
		name: "Tom",
		subclass: "dps",
		classOrder: 4,
		health: 290,
		tweak: 2,
		costs: { ability1: tweak(3), ability2: tweak(6) },
	},
	{
		id: "charbel",
		asset: "Charbel",
		name: "Charbel",
		subclass: "tank",
		classOrder: 4,
		health: 450,
		tweak: 1,
		costs: { ability1: tweak(2), ability2: tweak(3) },
	},
	{
		id: "etiglad",
		asset: "Etiglad",
		name: "Etiglad",
		subclass: "support",
		classOrder: 3,
		health: 0,
		tweak: 0,
		placeholder: true,
	},
	{
		id: "seb",
		asset: "Seb",
		name: "Seb",
		subclass: "assassin",
		classOrder: 3,
		health: 250,
		tweak: 2,
		costs: { ability1: tweak(2), ability2: tweak(5) },
	},
	{
		id: "antoine",
		asset: "Antoine",
		name: "Antoine",
		subclass: "support",
		classOrder: 2,
		health: 0,
		tweak: 0,
		placeholder: true,
	},
];

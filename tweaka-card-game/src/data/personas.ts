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
		health: 200,
		tweak: 5,
		costs: { ability1: tweak(3), ability2: tweak(10) },
	},
	{
		id: "paul",
		asset: "Paul",
		name: "Paul",
		subclass: "tank",
		classOrder: 1,
		health: 180,
		tweak: 2,
		costs: { ability1: tweak(3), ability2: tweak(2) },
	},
	{
		id: "samuel",
		asset: "Samuel",
		name: "Samuel",
		subclass: "assassin",
		classOrder: 0,
		health: 100,
		tweak: 4,
		costs: { ability1: tweak(3), ability2: tweak(2) },
	},
	{
		id: "oscar",
		asset: "Oscar",
		name: "Oscar",
		subclass: "support",
		classOrder: 0,
		health: 130,
		tweak: 1,
		costs: { ability1: tweak(1), ability2: tweak(7) },
	},
	{
		id: "jad",
		asset: "Jad",
		name: "Jad",
		subclass: "dps",
		classOrder: 3,
		health: 160,
		tweak: 3,
		costs: { ability2: tweak(5) },
	},
	{
		id: "marion",
		asset: "Marion",
		name: "Marion",
		subclass: "dps",
		classOrder: 2,
		health: 170,
		tweak: 0,
		costs: { ability1: tweak(2), ability2: tweak(15) },
	},
	{
		id: "xi",
		asset: "Xi",
		name: "Xi",
		subclass: "dps",
		classOrder: 1,
		health: 140,
		tweak: 1,
		costs: { ability1: tweak(1), ability2: tweak(2) },
	},
	{
		id: "yan",
		asset: "Yan",
		name: "Yan",
		subclass: "assassin",
		classOrder: 1,
		health: 110,
		tweak: 3,
		costs: { ability1: tweak(2), ability2: tweak(4) },
	},
	{
		id: "alain",
		asset: "Alain",
		name: "Alain",
		subclass: "support",
		classOrder: 1,
		health: 125,
		tweak: 2,
		costs: { ability1: tweak(5), ability2: tweak(5) },
	},
	{
		id: "jesus",
		asset: "Jesus",
		name: "Jesus",
		subclass: "dps",
		classOrder: 0,
		health: 150,
		tweak: 3,
		costs: { ability1: tweak(3), ability2: tweak(8) },
	},
	{
		id: "gabriel",
		asset: "Gabriel",
		name: "Gabriel",
		subclass: "tank",
		classOrder: 2,
		health: 190,
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
		health: 220,
		tweak: 5,
		costs: { ability1: tweak(5), ability2: tweak(9) },
	},
	{
		id: "victor",
		asset: "Victor",
		name: "Victor",
		subclass: "assassin",
		classOrder: 2,
		health: 150,
		tweak: 3,
		costs: { ability1: tweak(3), ability2: tweak(4) },
	},
];

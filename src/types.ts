import { User } from '@directus/types';

export type LayoutOptions = {
	groupField: string;
	groupTitle: string;
	dateField: string;
	userField: string;
	title: string;
	text: string;
	showUngrouped: boolean;
	sortField: string;
	sortDirection: 'asc' | 'desc';
	cardMaxHeight?: number;
	columnWidth?: number;
};

export type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
	page?: number;
};

export type Group = {
	id: string | number | null;
	title: string;
	items: Item[];
	sort: number;
	raw?: Record<string, any>;
};

export type Item = {
	id: string | number;
	sort: number;
	title?: string;
	text?: string;
	date?: string;
	item: Record<string, any>;
	users: User[];
};

export type ChangeEvent<T> = {
	added?: {
		element: T;
		newIndex: number;
	};
	removed?: {
		element: T;
		oldIndex: number;
	};
	moved?: {
		element: T;
		newIndex: number;
		oldIndex: number;
	};
};
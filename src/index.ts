import { defineLayout, useSync, useApi } from '@directus/extensions-sdk';
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import KanbanActions from './actions.vue';
import KanbanLayout from './kanban.vue';
import KanbanOptions from './options.vue';
import type { ChangeEvent, Group, Item, LayoutOptions, LayoutQuery } from './types';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'advanced-kanban-layout',
	name: 'Kanban (Advanced)',
	icon: 'view_week',
	component: KanbanLayout,
	headerShadow: false,
	sidebarShadow: false,
	slots: {
		options: KanbanOptions,
		sidebar: () => undefined,
		actions: KanbanActions,
	},
	setup(props, { emit }) {
		const api = useApi();
		const router = useRouter();
		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);
		const { collection, filter, search } = toRefs(props);

		const loading = ref(false);
		const error = ref<unknown>(null);
		const items = ref<Record<string, any>[]>([]);
		const fieldsInCollection = ref<any[]>([]);
		const totalCount = ref(0);
		const totalPages = ref(1);

		const relationalGroups = ref<Record<string, any>[]>([]);
		const groupsLoading = ref(false);

		const groupField = createViewOption<string | null>('groupField', null);
		const groupTitle = createViewOption<string | null>('groupTitle', null);
		const title = createViewOption<string | null>('title', null);
		const text = createViewOption<string | null>('text', null);
		const dateField = createViewOption<string | null>('dateField', null);
		const userField = createViewOption<string | null>('userField', null);
		const showUngrouped = createViewOption<boolean>('showUngrouped', true);
		const sortField = createViewOption<string | null>('sortField', null);
		const sortDirection = createViewOption<'asc' | 'desc'>('sortDirection', 'asc');
		const cardMaxHeight = createViewOption<number>('cardMaxHeight', 300);

		const primaryKeyField = computed(() => {
			return fieldsInCollection.value.find((f) => f.schema?.is_primary_key) || fieldsInCollection.value[0];
		});

		const selectedGroupFieldMeta = computed(() => {
			return fieldsInCollection.value.find((f) => f.field === groupField.value);
		});

		const isRelational = computed(() => {
			const meta = selectedGroupFieldMeta.value;
			if (!meta) return false;
			return !!meta.meta?.relation ||
				(meta.meta?.interface?.includes('m2o')) ||
				(meta.meta?.special?.some((s: string) => s.includes('user') || s.includes('file'))) ||
				(meta.type === 'uuid' && meta.schema?.foreign_key_table);
		});

		const relatedCollection = computed(() => {
			if (!isRelational.value) return null;
			const meta = selectedGroupFieldMeta.value;
			return meta?.meta?.relation?.related_collection ||
				meta?.schema?.foreign_key_table ||
				(meta?.meta?.special?.some((s: string) => s.includes('user')) ? 'directus_users' : null);
		});

		const fieldGroups = computed(() => {
			const all = fieldsInCollection.value;
			return {
				group: all.filter((f) => !['json', 'alias', 'presentation'].includes(f.type)),
				title: all.filter((f) => f.type === 'string'),
				text: all.filter((f) => f.type === 'string' || f.type === 'text'),
				date: all.filter((f) => ['date', 'time', 'dateTime', 'timestamp'].includes(f.type)),
				tags: all.filter((f) => f.type === 'json' || f.type === 'csv'),
				user: all.filter((f) =>
					f.meta?.relation?.related_collection === 'directus_users' ||
					f.schema?.foreign_key_table === 'directus_users'
				),
				file: all.filter((f) => f.type === 'uuid' || f.meta?.special?.some((s: string) => s.includes('file'))),
			};
		});

		const groupedItems = computed<Group[]>(() => {
			const pkField = primaryKeyField.value?.field;
			const groupKey = groupField.value;
			if (!pkField || !groupKey) return [];

			const itemGroups: Record<string | number, Group> = {};

			if (isRelational.value) {
				relationalGroups.value.forEach((group, index) => {
					const id = group.id;
					itemGroups[id] = {
						id,
						title: group.name || group.title || group.first_name || group.label || id,
						items: [],
						sort: index,
						raw: group,
					};
				});
			} else {
				const choices = selectedGroupFieldMeta.value?.meta?.options?.choices || [];
				choices.forEach((choice: any, index: number) => {
					itemGroups[choice.value] = { id: choice.value, title: choice.text || choice.value, items: [], sort: index };
				});
			}

			items.value.forEach((item) => {
				const rawVal = item[groupKey];
				if (!rawVal) return;
				const isObj = typeof rawVal === 'object';
				const id = isObj ? rawVal.id : rawVal;
				if (id !== null && id !== undefined) {
					if (!itemGroups[id]) {
						itemGroups[id] = { id, title: String(id), items: [], sort: 999, raw: isObj ? rawVal : { id } };
					} else if (isObj && (!itemGroups[id].raw || Object.keys(itemGroups[id].raw).length <= 1)) {
						itemGroups[id].raw = rawVal;
					}
				}
			});

			if (showUngrouped.value || Object.keys(itemGroups).length === 0) {
				itemGroups['_ungrouped'] = { id: null, title: 'Ungrouped', items: [], sort: -1 };
			}

			items.value.forEach((item, index) => {
				const rawVal = item[groupKey];
				const groupId = (rawVal && typeof rawVal === 'object') ? rawVal.id : rawVal;
				const targetGroupId = (groupId !== null && groupId !== undefined && itemGroups[groupId]) ? groupId : '_ungrouped';

				let users: any[] = [];
				if (userField.value && item[userField.value]) {
					const userData = item[userField.value];
					if (Array.isArray(userData)) {
						users = userData.map(u => u.directus_users_id || u);
					} else {
						users = [userData];
					}
				}

				itemGroups[targetGroupId].items.push({
					id: item[pkField],
					date: dateField.value ? item[dateField.value] : undefined,
					sort: index,
					item: item,
					users: users,
				});
			});

			return Object.values(itemGroups).sort((a, b) => a.sort - b.sort);
		});

		async function loadFields() {
			if (!collection.value) return;
			try {
				const response = await api.get(`/fields/${collection.value}`);
				fieldsInCollection.value = response.data.data || [];
			} catch (e) {
				console.error('[Kanban] Error loading fields:', e);
			}
		}

		async function loadRelationalGroups() {
			if (!isRelational.value || !groupField.value || !relatedCollection.value) {
				relationalGroups.value = [];
				return;
			}
			groupsLoading.value = true;
			try {
				const params: any = { limit: -1 };
				const fieldsToFetch = new Set(['id', 'name', 'title', 'first_name', 'label']);
				if (groupTitle.value) {
					const matches = groupTitle.value.matchAll(/\{\{\s*([\w\.]+)\s*\}\}/g);
					for (const match of matches) fieldsToFetch.add(match[1]);
				}
				params.fields = Array.from(fieldsToFetch);
				const response = await api.get(`/items/${relatedCollection.value}`, { params });
				relationalGroups.value = response.data.data || [];
			} catch (e) {
				console.warn('[Kanban] Permission restricted for global groups list. Using card-level data instead.');
				relationalGroups.value = [];
			} finally {
				groupsLoading.value = false;
			}
		}

		async function refresh() {
			if (!collection.value) return;
			loading.value = true;
			error.value = null;
			try {
				const fieldsToFetch = new Set(['*']);
				if (primaryKeyField.value?.field) fieldsToFetch.add(primaryKeyField.value.field);
				if (groupField.value) {
					fieldsToFetch.add(groupField.value);
					if (isRelational.value) fieldsToFetch.add(`${groupField.value}.*`);
				}
				if (dateField.value) fieldsToFetch.add(dateField.value);
				if (userField.value) {
					fieldsToFetch.add(`${userField.value}.*`);
					fieldsToFetch.add(`${userField.value}.avatar.id`);
				}

				[title.value, text.value].forEach(template => {
					if (!template) return;
					const matches = template.matchAll(/\{\{\s*([\w\.]+)\s*\}\}/g);
					for (const match of matches) fieldsToFetch.add(match[1]);
				});

				const params: any = {
					limit: layoutQuery.value?.limit || 250,
					page: layoutQuery.value?.page || 1,
					fields: Array.from(fieldsToFetch),
					meta: 'filter_count',
				};

				if (sortField.value) params.sort = sortDirection.value === 'desc' ? `-${sortField.value}` : sortField.value;
				if (search.value) params.search = search.value;
				if (filter.value) params.filter = filter.value;

				const response = await api.get(`/items/${collection.value}`, { params });
				items.value = response.data.data || [];
				totalCount.value = response.data.meta?.filter_count ?? items.value.length;
				totalPages.value = Math.ceil(totalCount.value / (layoutQuery.value?.limit || 250));
			} catch (err) {
				error.value = err;
				console.error('[Kanban] Error refreshing items:', err);
			} finally {
				loading.value = false;
			}
		}

		async function change(group: Group, event: ChangeEvent<Item>) {
			if (!event.added || !groupField.value || !collection.value) return;
			const itemId = event.added.element.id;
			const newGroupId = group.id;

			try {
				await api.patch(`/items/${collection.value}/${itemId}`, { [groupField.value]: newGroupId });
				await refresh();
			} catch (err) {
				console.error('[Kanban] Error updating item group:', err);
			}
		}

		function onClick({ item, event }: { item: Item; event: MouseEvent }) {
			const id = item.id;
			if (props.selectMode || event.ctrlKey || event.metaKey) {
				if (selection.value.includes(id)) {
					selection.value = selection.value.filter((i) => i !== id);
				} else {
					selection.value = [...selection.value, id];
				}
			} else {
				if (collection.value) router.push(`/content/${collection.value}/${id}`);
			}
		}

		function onUserClick(userId: string) { router.push(`/users/${userId}`); }

		watch(collection, async () => { await loadFields(); await refresh(); }, { immediate: true });
		watch(groupField, () => { loadRelationalGroups(); refresh(); });
		watch(groupTitle, () => { loadRelationalGroups(); });
		watch([filter, search, layoutQuery, title, text, userField, sortField, sortDirection, cardMaxHeight], () => refresh());

		return {
			groupedItems, groupField, groupTitle, title, text, dateField, userField, showUngrouped, sortField, sortDirection, cardMaxHeight, isRelational, relatedCollection, items, loading, error,
			totalCount, totalPages, page: computed(() => layoutQuery.value?.page || 1),
			itemCount: computed(() => items.value.length),
			showingCount: computed(() => String(totalCount.value)),
			refresh, change, onClick, onUserClick,
			fieldGroups, primaryKeyField,
			canReorderGroups: ref(true),
			canReorderItems: ref(true),
			resetPresetAndRefresh: async () => refresh(),
			changeGroupSort: async () => { },
			addGroup: async () => { },
			editGroup: async () => { },
			deleteGroup: async () => { },
		};

		function createViewOption<T>(key: keyof LayoutOptions, defaultValue: T) {
			return computed<T>({
				get: () => layoutOptions.value?.[key] !== undefined ? layoutOptions.value[key] as T : defaultValue,
				set: (val) => { layoutOptions.value = { ...layoutOptions.value, [key]: val }; },
			});
		}
	},
});

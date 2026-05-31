<script setup lang="ts">
import { useSync } from '@directus/extensions-sdk';
import { computed, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		fieldGroups: Record<string, any[]>;
		groupField?: string | null;
		groupTitle?: string | null;
		title?: string | null;
		text?: string | null;
		dateField?: string | null;
		userField?: string | null;
		showUngrouped?: boolean;
		sortField?: string | null;
		sortDirection?: 'asc' | 'desc';
		cardMaxHeight?: number;
		columnWidth?: number;
		itemsLimit?: number;
		ungroupedDisabled: boolean;
	}>(),
	{
		groupField: null,
		groupTitle: null,
		title: null,
		text: null,
		dateField: null,
		userField: null,
		showUngrouped: false,
		sortField: null,
		sortDirection: 'asc',
		cardMaxHeight: 22,
		columnWidth: 320,
		itemsLimit: 1000,
	},
);

const emit = defineEmits([
	'update:groupField',
	'update:groupTitle',
	'update:title',
	'update:text',
	'update:dateField',
	'update:userField',
	'update:showUngrouped',
	'update:sortField',
	'update:sortDirection',
	'update:cardMaxHeight',
	'update:columnWidth',
	'update:itemsLimit',
]);

const groupFieldSync = useSync(props, 'groupField', emit);
const groupTitleSync = useSync(props, 'groupTitle', emit);
const titleSync = useSync(props, 'title', emit);
const textSync = useSync(props, 'text', emit);
const dateFieldSync = useSync(props, 'dateField', emit);
const userFieldSync = useSync(props, 'userField', emit);
const showUngroupedSync = useSync(props, 'showUngrouped', emit);
const sortFieldSync = useSync(props, 'sortField', emit);
const sortDirectionSync = useSync(props, 'sortDirection', emit);
const cardMaxHeightSync = useSync(props, 'cardMaxHeight', emit);
const columnWidthSync = useSync(props, 'columnWidth', emit);
const itemsLimitSync = useSync(props, 'itemsLimit', emit);

function formatLabel(str: string) {
	return str
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (l) => l.toUpperCase());
}

function toItems(fields: any[]) {
	return fields.map((f) => ({
		text: f.name || formatLabel(f.field),
		value: f.field,
	}));
}

const selectedGroupFieldMeta = computed(() => {
	return (props.fieldGroups.group || []).find((f) => f.field === props.groupField);
});

const isRelational = computed(() => {
	const meta = selectedGroupFieldMeta.value;
	if (!meta) return false;
	return !!meta.meta?.relation || (meta.type === 'uuid' || meta.type === 'integer') && (meta.meta?.interface?.includes('m2o') || meta.meta?.special?.includes('user'));
});

const relatedCollection = computed(() => {
	if (!isRelational.value) return null;
	const meta = selectedGroupFieldMeta.value;
	return meta?.meta?.relation?.related_collection || meta?.schema?.foreign_key_table || (meta?.meta?.special?.includes('user') ? 'directus_users' : null);
});

const sortableFields = computed(() => {
	const all = [...(props.fieldGroups.group || []), ...(props.fieldGroups.date || [])];
	return Array.from(new Map(all.map(f => [f.field, f])).values());
});
</script>

<template>
	<div class="field">
		<div class="type-label">Group By</div>
		<VSelect
			v-model="groupFieldSync"
			:items="toItems(fieldGroups.group || [])"
			show-deselect
			placeholder="Select Group Field"
		/>
	</div>

	<div v-if="isRelational && relatedCollection" class="field">
		<div class="type-label">Group Header Template</div>
		<VCollectionFieldTemplate
			v-model="groupTitleSync"
			:collection="relatedCollection"
			placeholder="e.g. {{ name }}"
		/>
	</div>

	<div class="field">
		<div class="type-label">Title Template</div>
		<VCollectionFieldTemplate
			v-model="titleSync"
			:collection="collection"
		/>
	</div>

	<div class="field">
		<div class="type-label">Text Template</div>
		<VCollectionFieldTemplate
			v-model="textSync"
			:collection="collection"
		/>
	</div>

	<div class="field">
		<div class="type-label">Date Field</div>
		<VSelect
			v-model="dateFieldSync"
			:items="toItems(fieldGroups.date || [])"
			show-deselect
			placeholder="Select Date Field"
		/>
	</div>

	<div class="field">
		<div class="type-label">User Card</div>
		<VSelect
			v-model="userFieldSync"
			:items="toItems(fieldGroups.user || [])"
			show-deselect
			placeholder="Select User Field"
		/>
	</div>

	<VDetail class="field advanced-section">
		<template #title>Advanced Settings</template>
		
		<div class="field checkbox-row">
			<VCheckbox
				v-model="showUngroupedSync"
				label="Show Ungrouped"
				:disabled="ungroupedDisabled"
			/>
		</div>

		<div class="field">
			<div class="type-label">Sort Items By</div>
			<VSelect
				v-model="sortFieldSync"
				:items="toItems(sortableFields)"
				show-deselect
				placeholder="Default (Manual)"
			/>
		</div>

		<div class="field">
			<div class="type-label">Sort Direction</div>
			<VSelect
				v-model="sortDirectionSync"
				:items="[
					{ text: 'Ascending', value: 'asc' },
					{ text: 'Descending', value: 'desc' }
				]"
				:disabled="!sortField"
			/>
		</div>

		<div class="field">
			<div class="type-label">Card Max Height (px)</div>
			<VInput
				v-model="cardMaxHeightSync"
				type="number"
				min="10"
				max="1000"
				placeholder="e.g. 22"
			/>
		</div>

		<div class="field">
			<div class="type-label">Column Width (px)</div>
			<VInput
				v-model="columnWidthSync"
				type="number"
				min="150"
				max="1000"
				placeholder="e.g. 320"
			/>
		</div>

		<div class="field">
			<div class="type-label">Items Limit</div>
			<VInput
				v-model="itemsLimitSync"
				type="number"
				min="1"
				max="100000"
				placeholder="e.g. 1000"
			/>
			<div class="field-hint">Maximum number of items to fetch. Higher values may impact performance.</div>
		</div>
	</VDetail>
</template>

<style scoped>
.field {
	margin-bottom: 1.5rem;
}

.type-label {
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	color: var(--theme--foreground-subdued);
	margin-bottom: 0.5rem;
}

.checkbox-row {
	margin-top: 1rem;
	margin-bottom: 1rem;
}

:deep(.v-detail .title) {
	font-weight: 700 !important;
	color: var(--theme--primary) !important;
}

:deep(.v-detail .content) {
	padding-top: 1rem;
}

.field-hint {
	font-size: 0.7rem;
	color: var(--theme--foreground-subdued);
	margin-top: 0.25rem;
	line-height: 1.4;
}
</style>

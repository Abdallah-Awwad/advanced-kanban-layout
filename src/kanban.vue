<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import type { ChangeEvent, Group, Item, LayoutOptions } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		collection?: string | null;
		itemCount: number | null;
		totalCount: number | null;
		groupedItems?: Group[];
		change: (group: Group, event: ChangeEvent<Item>) => void;
		changeGroupSort: (event: ChangeEvent<Group>) => void;
		selection: any[];
		selectMode?: boolean;
		sortField?: string | null;
		canReorderGroups: boolean;
		canReorderItems: boolean;
		layoutOptions: LayoutOptions | null;
		error?: any;
		loading?: boolean;
		resetPresetAndRefresh: () => Promise<void>;
		onClick: (options: { item: Item; event: MouseEvent }) => void;
		onUserClick: (userId: string) => void;
		primaryKeyField?: any;
		title?: string | null;
		text?: string | null;
		groupTitle?: string | null;
		isRelational?: boolean;
		relatedCollection?: string | null;
	}>(),
	{
		groupedItems: () => [],
		selectMode: false,
		sortField: null,
	},
);

defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width']);

const { t } = useI18n();

const reorderGroupsDisabled = computed(() => !props.canReorderGroups || props.selectMode);

function getAvatarUrl(avatarId: string) {
	if (!avatarId) return null;
	return `/assets/${avatarId}?key=system-small-cover`;
}

function formatDate(dateStr: string) {
	if (!dateStr) return '';
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch (e) {
		return dateStr;
	}
}

function handleUserClick(event: MouseEvent, userId: string) {
	event.stopPropagation();
	props.onUserClick(userId);
}
</script>

<template>
	<div class="kanban-layout">
		<VProgressLinear v-if="loading" indeterminate fixed />
		
		<slot v-if="error" name="error" :error="error" :reset="resetPresetAndRefresh" />

		<div v-else class="kanban-board">
			<VNotice v-if="groupedItems.length === 0 && !loading" type="info">
				No groups found. Please check your "Group By" setting in the layout options.
			</VNotice>

			<Draggable
				:model-value="groupedItems"
				group="groups"
				item-key="id"
				draggable=".group-wrapper"
				:disabled="reorderGroupsDisabled"
				class="groups-scroll-container"
				@change="changeGroupSort"
			>
				<template #item="{ element: group }">
					<div class="group-wrapper">
						<div class="group">
							<div class="group-header">
								<div class="group-title">
									<template v-if="group.id === null">
										<span class="title-text subdued">{{ t('layouts.kanban.no_group') }}</span>
									</template>
									<template v-else-if="groupTitle && isRelational && relatedCollection && group.raw">
										<RenderTemplate
											:collection="relatedCollection"
											:template="groupTitle"
											:item="group.raw"
											class="title-text"
										/>
									</template>
									<template v-else>
										<span class="title-text">{{ group.title }}</span>
									</template>
									<span class="count-badge">{{ group.items.length }}</span>
								</div>
							</div>

							<Draggable
								:model-value="group.items"
								group="items"
								item-key="id"
								draggable=".card-wrapper"
								:disabled="!canReorderItems || selectMode"
								class="items-list"
								@change="change(group, $event)"
							>
								<template #item="{ element }">
									<div class="card-wrapper">
										<div
											class="item-card"
											:class="{ selected: selection.includes(element.id) }"
											@click="onClick({ item: element, event: $event })"
										>
											<div class="item-title">
												<RenderTemplate
													v-if="title"
													:collection="collection"
													:template="title"
													:item="element.item"
												/>
												<span v-else class="subdued">No Title ({{ element.id }})</span>
											</div>
											
											<div
												v-if="text"
												class="item-text"
												:style="{ maxHeight: (layoutOptions?.cardMaxHeight || 600) + 'px' }"
											>
												<RenderTemplate
													:collection="collection"
													:template="text"
													:item="element.item"
												/>
											</div>
											
											<div class="item-footer">
												<div v-if="element.date" class="item-date">
													<VIcon name="event" size="12" />
													<span>{{ formatDate(element.date) }}</span>
												</div>
												<div v-else></div>

												<div v-if="element.users && element.users.length > 0" class="item-avatars">
													<VAvatar
														v-for="user in element.users.slice(0, 3)"
														:key="user.id"
														v-tooltip="`${user.first_name || ''} ${user.last_name || ''}`"
														x-small
														class="avatar"
														@click="handleUserClick($event, user.id)"
													>
														<VImage v-if="user.avatar?.id" :src="getAvatarUrl(user.avatar.id)" />
														<span v-else>{{ (user.first_name || '?')[0] }}</span>
													</VAvatar>
													<span v-if="element.users.length > 3" class="avatar-more">
														+{{ element.users.length - 3 }}
													</span>
												</div>
											</div>
										</div>
									</div>
								</template>
							</Draggable>
						</div>
					</div>
				</template>
			</Draggable>
		</div>
	</div>
</template>

<style scoped lang="scss">
.kanban-layout {
	height: calc(100vh - var(--header-bar-height) - 100px);
	min-height: 400px;
	background-color: var(--theme--background);
	overflow: hidden;
}

.kanban-board {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.groups-scroll-container {
	display: flex;
	flex: 1;
	overflow-x: auto;
	overflow-y: hidden;
	padding: 1rem;
	gap: 1.25rem;
	align-items: stretch;
}

.group-wrapper {
	inline-size: 20rem;
	flex-shrink: 0;
	block-size: 100%;
	display: flex;
	flex-direction: column;
}

.group {
	display: flex;
	flex-direction: column;
	height: 100%;
	background-color: var(--theme--background-normal);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
}

.group-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.875rem 1rem;
	font-weight: 700;
	background-color: var(--theme--background);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	flex-shrink: 0;
}

.group-title {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	overflow: hidden;

	.title-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--theme--foreground);
		font-size: 0.9rem;
		font-weight: 700;

		&.subdued {
			color: var(--theme--foreground-subdued);
			font-weight: 400;
			font-style: italic;
		}
	}
}

.count-badge {
	font-size: 0.7rem;
	background-color: var(--theme--background-accent);
	color: var(--theme--foreground-accent);
	padding: 0.125rem 0.5rem;
	border-radius: 1rem;
	min-width: 1.5rem;
	text-align: center;
}

.items-list {
	flex: 1;
	overflow-y: auto;
	padding: 0.75rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	min-height: 100px;
}

.card-wrapper {
	flex-shrink: 0;
}

.item-card {
	padding: 1rem;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--theme--border-color);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		border-color: var(--theme--primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	&.selected {
		outline: 2px solid var(--theme--primary);
		background-color: var(--theme--primary-subdued);
	}
}

.item-title {
	font-weight: 700;
	margin-block-end: 0.5rem;
	color: var(--theme--primary);
	line-height: 1.4;
	font-size: 0.95rem;
	font-size: 0.95rem;
	white-space: normal !important;
	text-overflow: ellipsis;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;

	.subdued {
		color: var(--theme--foreground-subdued);
		font-weight: 400;
		font-style: italic;
	}
}


.item-text {
	font-size: 0.85rem;
	color: var(--theme--foreground);
	line-height: 1.5;
	margin-bottom: 0.5rem;
	word-break: break-word;
	white-space: pre-wrap;
	overflow: hidden;
	position: relative;

}

.render-template{
	white-space: normal !important;
}

.item-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-block-start: 0.75rem;
	padding-top: 0.625rem;
	border-top: 1px solid var(--theme--border-color-subdued);
}

.item-date {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.item-avatars {
	display: flex;
	flex-direction: row-reverse;
	align-items: center;
	gap: -0.5rem;

	.avatar {
		border: 2px solid var(--theme--background);
		margin-inline-start: -0.5rem;
		transition: transform 0.2s ease;
		cursor: pointer;
		
		&:hover {
			transform: scale(1.1);
			z-index: 10;
		}
	}

	.avatar-more {
		font-size: 0.7rem;
		color: var(--theme--foreground-subdued);
		margin-inline-end: 0.25rem;
	}
}
</style>

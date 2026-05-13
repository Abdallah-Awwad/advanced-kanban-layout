<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
	showingCount?: string;
}>();
</script>

<template>
	<Transition name="fade">
		<span v-if="showingCount" class="item-count">
			{{ showingCount }}
		</span>
	</Transition>
</template>

<style scoped>
.item-count {
	position: relative;
	display: none;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
}

@media (min-width: 640px) {
	.item-count {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
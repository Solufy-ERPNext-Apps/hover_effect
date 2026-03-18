<script setup>
import { computed } from "vue";
import Avatar from "frappe-ui/src/components/Avatar.vue";
import Badge from "frappe-ui/src/components/Badge.vue";
import Button from "frappe-ui/src/components/Button.vue";
import ListView from "frappe-ui/src/components/ListView/ListView.vue";
import ListHeader from "frappe-ui/src/components/ListView/ListHeader.vue";
import ListHeaderItem from "frappe-ui/src/components/ListView/ListHeaderItem.vue";
import ListRow from "frappe-ui/src/components/ListView/ListRow.vue";
import ListRowItem from "frappe-ui/src/components/ListView/ListRowItem.vue";
import ListRows from "frappe-ui/src/components/ListView/ListRows.vue";
import ListSelectBanner from "frappe-ui/src/components/ListView/ListSelectBanner.vue";
import {
  AtSign,
  CheckCircle,
  Users,
  User,
} from "lucide-vue-next";

const props = defineProps({
  title: {
    type: String,
    default: "Details",
  },
  rows: {
    type: Array,
    default: () => [],
  },
});

const columns = [
  { label: "Name", key: "name", width: 3, icon: User },
  { label: "Email", key: "email", width: "240px", icon: AtSign },
  { label: "Role", key: "role", icon: Users },
  { label: "Status", key: "status", icon: CheckCircle },
];

const safeRows = computed(() => {
  return (props.rows || []).map((row, index) => ({
    id: row.id || index + 1,
    name: {
      label: row.name?.label || row.name || "—",
      image: row.name?.image || null,
    },
    email: row.email || "—",
    role: {
      label: row.role?.label || row.role || "—",
      color: row.role?.color || "gray",
    },
    status: {
      label: row.status?.label || row.status || "—",
      bg_color: row.status?.bg_color || "bg-gray-400",
    },
    raw: row.raw || row,
  }));
});

function onRowClick(row) {
  if (row?.raw?.route) {
    window.open(row.raw.route, "_blank");
    return;
  }
  console.log("Clicked row:", row);
}
</script>

<template>
  <div class="p-3">
    <div class="mb-3 text-lg font-semibold">
      {{ title }}
    </div>

    <ListView
      class="h-[520px]"
      :columns="columns"
      :rows="safeRows"
      :options="{
        onRowClick,
        selectable: true,
        showTooltip: true,
        resizeColumn: true,
      }"
      row-key="id"
    >
      <ListHeader>
        <ListHeaderItem
          v-for="column in columns"
          :key="column.key"
          :item="column"
        >
          <template #prefix="{ item }">
            <component :is="item.icon" class="h-4 w-4" />
          </template>
        </ListHeaderItem>
      </ListHeader>

      <ListRows>
        <ListRow
          v-for="row in safeRows"
          :key="row.id"
          v-slot="{ column, item }"
          :row="row"
        >
          <ListRowItem :item="item" :align="column.align">
            <template #prefix>
              <div
                v-if="column.key === 'status'"
                class="h-3 w-3 rounded-full"
                :class="item.bg_color"
              />
              <Avatar
                v-if="column.key === 'name'"
                shape="circle"
                :image="item.image"
                size="sm"
              />
            </template>

            <Badge
              v-if="column.key === 'role'"
              variant="subtle"
              :theme="item.color"
              size="md"
              :label="item.label"
            />
          </ListRowItem>
        </ListRow>
      </ListRows>

      <ListSelectBanner>
        <template #actions="{ unselectAll }">
          <div class="flex gap-2">
            <Button variant="ghost" label="Delete" />
            <Button variant="ghost" label="Unselect all" @click="unselectAll" />
          </div>
        </template>
      </ListSelectBanner>
    </ListView>
  </div>
</template>
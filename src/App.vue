<script setup lang="ts">
import Options from './components/Options.vue'
import { remap } from './utils';
const { x, y } = useMouse({type: 'client'})
const root = ref(null)
const { top, bottom, left, right} = useElementBounding(root)

const [expended, toggleExpended] = useToggle(false)
const [showOptions, toggleShowOptions] = useToggle(false)
const alpha = ref(1)
watch([x,y], ()=>{
  if(expended.value) return
  const distance = Math.sqrt(
    (x.value-(left.value+right.value)/2)**2
    + (y.value-(top.value+bottom.value)/2)**2
  )
  alpha.value = remap(200, 40, 1, 1, distance)
})
watch(expended, (newVal)=>{
  if(!newVal) {
    showOptions.value = false
  }
})
</script>

<template>
  <div ref="root" class="fixed top-10 flex items-center h-12 right-0 z-99999 bg-blue-5 transition-transform"
    :class="[expended?'':'translate-x-full']"
    :style="{ opacity: alpha }">
      <div class="p-2 cursor-pointer hover:backdrop-brightness-125 active:backdrop-brightness-50" :class="[showOptions ? 'backdrop-brightness-70' : '']"
        @click="toggleShowOptions()">
        <div class="i-carbon-settings w-8 h-8"></div>
      </div>
      <div class="absolute right-full top-0 bottom-0 border-r border-color-blue-3 border-solid w-4 rounded-l-md text-white cursor-pointer bg-blue-5"
      @click="toggleExpended()">
        <div class="w-full h-full flex items-center rounded-l-md hover:backdrop-brightness-125 active:backdrop-brightness-50">
          <div :class="[expended? 'i-carbon-chevron-right' : 'i-carbon-chevron-left']"></div>
        </div>
      </div>
    <div v-if="showOptions" class="absolute top-full right-0 p-2 rounded-2xl bg-dark-1">
      <Options />
    </div>
  </div>
  
</template>

<style scoped>

</style>

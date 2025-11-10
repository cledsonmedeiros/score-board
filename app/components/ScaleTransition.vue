<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="scale-0 opacity-0"
    enter-to-class="scale-100 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="scale-100 opacity-100"
    leave-to-class="scale-0 opacity-0"
  >
    <slot />
  </Transition>
</template>

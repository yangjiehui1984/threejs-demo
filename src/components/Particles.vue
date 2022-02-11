<template>
    <div>
        <div ref="container" class="container"></div>
    </div>
</template>

<script lang="ts">
import Game from "../game/particles";
export default {
    mounted() {
        const game = new Game(this.$refs["container"]);
        this.game = game;
    },
    beforeDestroy() {
        this.game.dispatchEvent({ type: "gameEvent", value: "dispose" });
        console.log("beforeDestroy");

    },
};
</script>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    border: 1px solid red;
}
</style>

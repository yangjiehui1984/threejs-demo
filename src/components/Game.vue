<template>
    <div>
        <div ref="container" class="container"></div>
        <video src="static/video/video.mov" webkit-playsinline playsinline loop muted></video>
    </div>
</template>

<script lang="ts">
import Game from "../game/main";
export default {
    mounted() {
        console.log('Game。。。。')
        const game = new Game(this.$refs["container"]);
        this.game = game;
        game.addEventListener("gameEvent", (event) => {
            console.log('跳转', event.value)
            if(event.value == 'gotoJump'){
                //跳转路由
                this.$router.push('/jump');
            }
            else if(event.value == 'gotoParticles'){
                this.$router.push('/particles');
            }
            else if(event.value == 'gotoModel'){
                this.$router.push('/model');
            }
        });
        this.game = game;
    },
    beforeDestroy(){
        console.log('beforeDestroy')
        this.game.dispatchEvent( { type: 'gameEvent', value: 'dispose'} );
        this.game = null;
    }
};
</script>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    border: 1px solid red;
}

video{
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
}
</style>

<template>
    <div>
        <div ref="container" class="container">
            <div class="title">跳一跳</div>
            <div class="score">score:{{score}}</div>
            <div v-show="gameover" class="gameover">
                <div class="title">GameOver!</div>
                <button @click="restart()">
                    Restart
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import Game from "../game/jump";
export default {
    data(){
        return {
            score: 0,
            gameover: false
        }
    },
    mounted() {
        const game = new Game(this.$refs["container"]);
        game.addEventListener('gameEvent', (event)=>{
            console.log('gameEvent', event)
            switch(event.value){
                case 'addScore': {
                    this.score++;
                    console.log(this.score)
                    break;
                }
                case 'gameover':{
                    this.gameover = true;
                    break;
                }
                default:
                    break;
            }
        });
        this.game = game;
    },
    beforeDestroy(){
        this.game.dispatchEvent( { type: 'gameEvent', value: 'dispose'} );
        console.log('beforeDestroy')
    },
    methods: {
        restart(){
            this.gameover = false;
            this.score = 0;
            this.game.dispatchEvent( { type: 'gameEvent', value: 'restart'} );
        }
    }
};
</script>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    border: 1px solid red;
}
.score{
    position: absolute;
    top: 50px;
    right: 50px;
    font-size: 40px;
    font-weight: bold;
}

.title{
    position: absolute;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 50px;
    font-weight: 500;
}
.gameover{
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 200px;
    font-weight: 700;
}

.gameover button{
    margin-top: 400px;
    width: 80px;
    height: 40px;
    font-size: 20px;
}
</style>

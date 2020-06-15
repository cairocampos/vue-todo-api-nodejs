var modal = Vue.component("modal", {
    props: ["task"],
    data() {
        return {
            id: this.task.id,
            title: this.task.title,
            status: this.task.status,
        }
    },
    template: `
        <div class="modal-bg" @click="closeModal($event)">
            <div class="modal-content">
                <p>ALTERAR TAREFA</p>
                <form>
                    <label>Titulo</label>
                    <input v-model="title">
                    <label>Status</label>
                    <select v-model="status">
                        <option value="0">Pendente</option>
                        <option value="1">Completado</option>
                    </select>
                    <button @click.prevent="updateTask(id)">Atualizar</button>
                </form>
            </div>
        </div>
    `,
    methods: {
        async updateTask(id) {
            let res = await fetch(`http://localhost:3000/tasks/${id}`, {
                method: "PUT",
                headers: {
                    'Accept':'application/json',
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({title: this.title, status:this.status, level:0})
            });
            let data = await res.json();
            this.$emit("reset", data);
        },
        closeModal({target,currentTarget}) {
            if(target === currentTarget) {
                this.$emit("reset", this.task)
            }
        }
    }
});

var vm = new Vue({
    el:"#app",
    components: {
        'modal':modal
    },
    data: {
        apiPath: "http://localhost:3000",
        tasks: [],
        newTask: "",
        loading:false,
        task: {}
    },
    computed: {
        report(){
            let completed = 0; pending = 0;
            for(let task of this.tasks) {
                if(task.status === 1) {
                    completed++;
                } else if(task.status === 0) {
                    pending++;
                }
            }

            return {completed, pending};
        },
    },
    methods: {
        updateElement(element) {
            this.task = {}
            this.tasks.find(task => {
                if(task.id === element.id) {
                    task.title = element.title; 
                    task.status = element.status; 
                }
            })
        },
        async request(endpoint, body = {}, method = "GET"){
            this.loading = true;
            let params = {};
            params.headers = {
                'Accept':'application/json',
                'Content-Type':'application/json'
            }
            params.method = method;

            if(method != "GET") {
                params.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.apiPath}${endpoint}`, params);
            const data = await response.json();
            this.loading = false;
            return data;
        },
        async getTasks() {
            let data =  await this.request("/tasks");
            this.tasks = data
        },
        async addTask() {

            if(!this.newTask.trim().length > 0) {
                return;
            }

            let title = this.newTask;
            let status = 0;
            let level = 0;
            let data = await this.request("/tasks", {title, status, level}, "POST")
            if(data) {
                this.tasks.push(data);
                this.newTask = "";
            }
        },
        async deleteTask(id, index) {
            let confirmar = confirm("Deseja remover essa tarefa ?");
            if(confirmar) {
                let data = await this.request(`/tasks/${id}`, {}, "DELETE");

                if(data.success) {
                    this.tasks.splice(index,1);
                }
            }
        },
        async verifyTask(id, index) {
            let {title, status, level} = this.tasks[index];
            let newStatus = null;
            if(status === 1) {
                newStatus = 0;
            } else {
                newStatus = 1;
            }

            let data = await this.request(`/tasks/${id}`, {title, level, status: newStatus}, "PUT");
            if(data) {
                this.tasks.filter(task => {
                    if(task.id === id)
                        task.status = data.status
                });
            }
        },
        showModalEdit(task) {
            this.task = task;
        }
    },
    created() {
        this.getTasks();
    }
});
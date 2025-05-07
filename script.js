document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let precos = {};
    let orcamento = {
        formato: 'a5',
        orientacao: 'retrato',
        quantidade: 100,
        capa: 'comum',
        adicionais_capa: [],
        acabamento: 'brochura',
        papel: 'offset',
        gramatura: '75',
        paginas_pb: 0,
        paginas_color: 0,
        servicos: [],
        frete: {
            cep: '',
            opcao: '',
            valor: 0
        },
        arquivos: {
            miolo: null,
            capa: null
        }
    };

    // Carregar dados de preços do JSON
    fetch('precos.json')
        .then(response => response.json())
        .then(data => {
            precos = data;
            atualizarPrecosPaginas();
            atualizarPrecoServicos();
            atualizarOrcamento();
        })
        .catch(error => console.error('Erro ao carregar preços:', error));

    // Navegação entre etapas
    const steps = document.querySelectorAll('.step');
    const progressSteps = document.querySelectorAll('.progress-steps li');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.step.active');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            
            if (validarEtapa(currentIndex + 1)) {
                currentStep.classList.remove('active');
                steps[currentIndex + 1].classList.add('active');
                
                progressSteps[currentIndex].classList.remove('active');
                progressSteps[currentIndex + 1].classList.add('active');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.step.active');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            
            currentStep.classList.remove('active');
            steps[currentIndex - 1].classList.add('active');
            
            progressSteps[currentIndex].classList.remove('active');
            progressSteps[currentIndex - 1].classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    progressSteps.forEach((step, index) => {
        step.addEventListener('click', () => {
            const currentStep = document.querySelector('.step.active');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            
            if (index < currentIndex || validarEtapaAnterior(index)) {
                document.querySelector('.step.active').classList.remove('active');
                steps[index].classList.add('active');
                
                document.querySelector('.progress-steps li.active').classList.remove('active');
                progressSteps[index].classList.add('active');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // Validação de etapas
    function validarEtapa(etapa) {
        switch(etapa) {
            case 1: // Formato para Capa
                const quantidade = parseInt(document.getElementById('quantidade').value);
                if (isNaN(quantidade) || quantidade <= 0) {
                    alert('Por favor, informe uma quantidade válida.');
                    return false;
                }
                return true;
            
            case 4: // Acabamento para Miolo
                const acabamento = document.querySelector('input[name="tipo-acabamento"]:checked').value;
                if (acabamento === 'brochura' && (orcamento.paginas_pb + orcamento.paginas_color) < 48) {
                    alert('O acabamento em brochura requer no mínimo 48 páginas.');
                    return false;
                }
                if (acabamento === 'grampo' && (orcamento.paginas_pb + orcamento.paginas_color) > 72) {
                    alert('O acabamento em grampo suporta no máximo 72 páginas.');
                    return false;
                }
                return true;
            
            default:
                return true;
        }
    }

    function validarEtapaAnterior(etapa) {
        for (let i = 1; i <= etapa; i++) {
            if (!validarEtapa(i)) {
                return false;
            }
        }
        return true;
    }

    // Formato do Livro
    document.getElementById('tamanho').addEventListener('change', function() {
        const personalizado = this.value === 'personalizado';
        document.getElementById('tamanho-personalizado').classList.toggle('hidden', !personalizado);
        
        orcamento.formato = this.value;
        atualizarOrcamento();
    });

    document.querySelectorAll('.option-button[data-value]').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelector('.option-button.active').classList.remove('active');
            this.classList.add('active');
            
            orcamento.orientacao = this.dataset.value;
            atualizarOrcamento();
        });
    });

    document.getElementById('quantidade').addEventListener('input', function() {
        orcamento.quantidade = parseInt(this.value) || 0;
        atualizarOrcamento();
    });

    // Tipo de Capa
    document.querySelectorAll('input[name="tipo-capa"]').forEach(input => {
        input.addEventListener('change', function() {
            orcamento.capa = this.value;
            atualizarOrcamento();
        });
    });

    document.querySelectorAll('input[name="adicionais-capa"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                if (!orcamento.adicionais_capa.includes(this.value)) {
                    orcamento.adicionais_capa.push(this.value);
                }
            } else {
                orcamento.adicionais_capa = orcamento.adicionais_capa.filter(item => item !== this.value);
            }
            atualizarOrcamento();
        });
    });

    // Tipo de Acabamento
    document.querySelectorAll('input[name="tipo-acabamento"]').forEach(input => {
        input.addEventListener('change', function() {
            orcamento.acabamento = this.value;
            atualizarOrcamento();
        });
    });

    // Miolo (Páginas Internas)
    document.getElementById('tipo-papel').addEventListener('change', function() {
        orcamento.papel = this.value;
        atualizarPrecosPaginas();
        atualizarOrcamento();
    });

    document.getElementById('gramatura').addEventListener('change', function() {
        orcamento.gramatura = this.value;
        atualizarPrecosPaginas();
        atualizarOrcamento();
    });

    document.getElementById('paginas-pb').addEventListener('input', function() {
        orcamento.paginas_pb = parseInt(this.value) || 0;
        atualizarTotalPaginas();
        atualizarOrcamento();
    });

    document.getElementById('paginas-color').addEventListener('input', function() {
        orcamento.paginas_color = parseInt(this.value) || 0;
        atualizarTotalPaginas();
        atualizarOrcamento();
    });

    function atualizarTotalPaginas() {
        const totalPaginas = orcamento.paginas_pb + orcamento.paginas_color;
        document.getElementById('total-paginas').textContent = totalPaginas;
    }

    function atualizarPrecosPaginas() {
        if (!precos.papeis) return;
        
        const papel = orcamento.papel;
        const gramatura = orcamento.gramatura;
        
        if (precos.papeis[papel] && precos.papeis[papel].gramaturas[gramatura]) {
            const precoPB = precos.papeis[papel].gramaturas[gramatura].preco_pb;
            const precoColor = precos.papeis[papel].gramaturas[gramatura].preco_color;
            
            document.getElementById('preco-pb').textContent = precoPB.toFixed(2);
            document.getElementById('preco-color').textContent = precoColor.toFixed(2);
        }
    }

    // Serviços Adicionais
    document.querySelectorAll('input[name="servicos-adicionais"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                if (!orcamento.servicos.includes(this.value)) {
                    orcamento.servicos.push(this.value);
                }
            } else {
                orcamento.servicos = orcamento.servicos.filter(item => item !== this.value);
            }
            atualizarOrcamento();
        });
    });

    function atualizarPrecoServicos() {
        if (!precos.servicos) return;
        
        document.getElementById('preco-diagramacao').textContent = precos.servicos.diagramacao.preco.toFixed(2);
        document.getElementById('preco-criacao-capa').textContent = precos.servicos['criacao-capa'].preco.toFixed(2);
        document.getElementById('preco-prova-impressa').textContent = precos.servicos['prova-impressa'].preco.toFixed(2);
    }

    // Upload de Arquivos
    document.getElementById('upload-miolo').addEventListener('change', function(e) {
        if (this.files.length > 0) {
            const file = this.files[0];
            orcamento.arquivos.miolo = file;
            document.getElementById('miolo-file-info').textContent = file.name;
        }
    });

    document.getElementById('upload-capa').addEventListener('change', function(e) {
        if (this.files.length > 0) {
            const file = this.files[0];
            orcamento.arquivos.capa = file;
            document.getElementById('capa-file-info').textContent = file.name;
        }
    });

    // Endereço e Frete
    document.getElementById('cep').addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        this.value = value;
        orcamento.frete.cep = value;
    });

    document.getElementById('calcular-frete').addEventListener('click', function() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            alert('Por favor, informe um CEP válido.');
            return;
        }
        
        // Simulação de consulta de CEP e cálculo de frete
        consultarCEP(cep);
    });

    function consultarCEP(cep) {
        // Simulação de consulta de CEP usando a API ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    alert('CEP não encontrado.');
                    return;
                }
                
                // Preencher campos de endereço
                document.getElementById('rua').value = data.logradouro;
                document.getElementById('bairro').value = data.bairro;
                document.getElementById('cidade').value = data.localidade;
                document.getElementById('estado').value = data.uf;
                
                document.getElementById('endereco-container').classList.remove('hidden');
                
                // Simular cálculo de frete
                calcularFrete(cep);
            })
            .catch(error => {
                console.error('Erro ao consultar CEP:', error);
                alert('Erro ao consultar CEP. Tente novamente.');
            });
    }

    function calcularFrete(cep) {
        // Simulação de cálculo de frete
        // Em uma aplicação real, isso seria feito com uma API de frete
        
        const peso = calcularPesoEstimado();
        const distancia = Math.floor(Math.random() * 2000) + 100; // Simulação de distância
        
        const valorPAC = (peso * 0.5 + distancia * 0.001).toFixed(2);
        const valorSEDEX = (peso * 0.8 + distancia * 0.002).toFixed(2);
        const valorTransportadora = (peso * 0.6 + distancia * 0.0015).toFixed(2);
        
        document.getElementById('valor-pac').textContent = valorPAC;
        document.getElementById('valor-sedex').textContent = valorSEDEX;
        document.getElementById('valor-transportadora').textContent = valorTransportadora;
        
        document.getElementById('opcoes-frete').classList.remove('hidden');
        
        // Selecionar opção de frete
        document.querySelectorAll('input[name="opcao-frete"]').forEach(input => {
            input.addEventListener('change', function() {
                let valorFrete = 0;
                
                switch(this.value) {
                    case 'pac':
                        valorFrete = parseFloat(valorPAC);
                        break;
                    case 'sedex':
                        valorFrete = parseFloat(valorSEDEX);
                        break;
                    case 'transportadora':
                        valorFrete = parseFloat(valorTransportadora);
                        break;
                }
                
                orcamento.frete.opcao = this.value;
                orcamento.frete.valor = valorFrete;
                atualizarOrcamento();
            });
        });
    }

    function calcularPesoEstimado() {
        // Simulação de cálculo de peso baseado nas características do livro
        const totalPaginas = orcamento.paginas_pb + orcamento.paginas_color;
        const pesoBase = 0.1; // Peso base em kg
        const pesoPorPagina = 0.002; // Peso por página em kg
        
        let pesoTotal = pesoBase + (totalPaginas * pesoPorPagina);
        
        // Adicionar peso da capa
        if (orcamento.capa === 'dura') {
            pesoTotal += 0.2;
        } else {
            pesoTotal += 0.05;
        }
        
        return pesoTotal * orcamento.quantidade;
    }

    // Finalizar orçamento
    document.getElementById('finalizar-orcamento').addEventListener('click', function() {
        const modal = document.getElementById('modal-orcamento');
        const listaDetalhes = document.getElementById('lista-detalhes');
        const modalTotal = document.getElementById('modal-total');
        
        // Limpar lista de detalhes
        listaDetalhes.innerHTML = '';
        
        // Preencher detalhes do orçamento
        const detalhes = [
            { label: 'Formato', valor: document.getElementById('resumo-formato').textContent },
            { label: 'Orientação', valor: document.getElementById('resumo-orientacao').textContent },
            { label: 'Quantidade', valor: document.getElementById('resumo-quantidade').textContent },
            { label: 'Tipo de Capa', valor: document.getElementById('resumo-capa').textContent },
            { label: 'Acabamento', valor: document.getElementById('resumo-acabamento').textContent },
            { label: 'Papel do Miolo', valor: document.getElementById('resumo-papel').textContent },
            { label: 'Páginas P&B', valor: document.getElementById('resumo-paginas-pb').textContent },
            { label: 'Páginas Coloridas', valor: document.getElementById('resumo-paginas-color').textContent }
        ];
        
        if (document.getElementById('resumo-adicionais').textContent !== '-') {
            detalhes.push({ label: 'Adicionais', valor: document.getElementById('resumo-adicionais').textContent });
        }
        
        if (document.getElementById('resumo-servicos').textContent !== '-') {
            detalhes.push({ label: 'Serviços', valor: document.getElementById('resumo-servicos').textContent });
        }
        
        if (document.getElementById('resumo-frete').textContent !== '-') {
            detalhes.push({ label: 'Frete', valor: document.getElementById('resumo-frete').textContent });
        }
        
        detalhes.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.label}:</strong> <span>${item.valor}</span>`;
            listaDetalhes.appendChild(li);
        });
        
        // Preencher total
        modalTotal.textContent = document.getElementById('resumo-total').textContent;
        
        // Exibir modal
        modal.style.display = 'block';
    });

    // Fechar modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('modal-orcamento').style.display = 'none';
    });

    // Botões do modal
    document.getElementById('editar-orcamento').addEventListener('click', function() {
        document.getElementById('modal-orcamento').style.display = 'none';
    });

    document.getElementById('confirmar-orcamento').addEventListener('click', function() {
        alert('Orçamento enviado com sucesso! Em breve entraremos em contato.');
        document.getElementById('modal-orcamento').style.display = 'none';
    });

    // Cálculo do orçamento
    function atualizarOrcamento() {
        if (!precos.formatos) return;
        
        // Formato e quantidade
        let precoBase = precos.formatos[orcamento.formato].preco_base;
        const quantidade = orcamento.quantidade;
        
        // Aplicar desconto por quantidade
        let desconto = 0;
        const quantidades = Object.keys(precos.descontos_quantidade).map(Number).sort((a, b) => a - b);
        
        for (let i = quantidades.length - 1; i >= 0; i--) {
            if (quantidade >= quantidades[i]) {
                desconto = precos.descontos_quantidade[quantidades[i]];
                break;
            }
        }
        
        // Capa
        const precoCapa = precos.capas[orcamento.capa].preco;
        
        // Adicionais da capa
        let precoAdicionais = 0;
        let adicionaisTexto = [];
        
        orcamento.adicionais_capa.forEach(adicional => {
            const adicionalInfo = precos.adicionais_capa[adicional];
            
            // Verificar quantidade mínima
            if (adicionalInfo.min_quantidade && quantidade < adicionalInfo.min_quantidade) {
                return;
            }
            
            precoAdicionais += adicionalInfo.preco;
            adicionaisTexto.push(adicionalInfo.nome);
        });
        
        // Acabamento
        const precoAcabamento = precos.acabamentos[orcamento.acabamento].preco;
        
        // Miolo
        const precoPB = precos.papeis[orcamento.papel].gramaturas[orcamento.gramatura].preco_pb;
        const precoColor = precos.papeis[orcamento.papel].gramaturas[orcamento.gramatura].preco_color;
        
        const custoPB = precoPB * orcamento.paginas_pb;
        const custoColor = precoColor * orcamento.paginas_color;
        
        // Serviços adicionais
        let precoServicos = 0;
        let servicosTexto = [];
        
        orcamento.servicos.forEach(servico => {
            precoServicos += precos.servicos[servico].preco;
            servicosTexto.push(precos.servicos[servico].nome);
        });
        
        // Cálculo do subtotal
        const subtotalUnitario = precoBase + precoCapa + precoAdicionais + precoAcabamento + custoPB + custoColor;
        const subtotal = subtotalUnitario * quantidade * (1 - desconto);
        
        // Total final
        const total = subtotal + precoServicos + orcamento.frete.valor;
        
        // Atualizar resumo
        document.getElementById('resumo-formato').textContent = precos.formatos[orcamento.formato].nome;
        document.getElementById('resumo-orientacao').textContent = orcamento.orientacao === 'retrato' ? 'Retrato' : 'Paisagem';
        document.getElementById('resumo-quantidade').textContent = quantidade;
        document.getElementById('resumo-capa').textContent = precos.capas[orcamento.capa].nome;
        document.getElementById('resumo-acabamento').textContent = precos.acabamentos[orcamento.acabamento].nome;
        document.getElementById('resumo-papel').textContent = `${precos.papeis[orcamento.papel].nome} ${precos.papeis[orcamento.papel].gramaturas[orcamento.gramatura].nome}`;
        document.getElementById('resumo-paginas-pb').textContent = orcamento.paginas_pb;
        document.getElementById('resumo-paginas-color').textContent = orcamento.paginas_color;
        
        document.getElementById('resumo-adicionais').textContent = adicionaisTexto.length > 0 ? adicionaisTexto.join(', ') : '-';
        document.getElementById('resumo-servicos').textContent = servicosTexto.length > 0 ? servicosTexto.join(', ') : '-';
        
        // Frete
        if (orcamento.frete.opcao) {
            let freteTexto = '';
            switch(orcamento.frete.opcao) {
                case 'pac':
                    freteTexto = 'PAC';
                    break;
                case 'sedex':
                    freteTexto = 'SEDEX';
                    break;
                case 'transportadora':
                    freteTexto = 'Transportadora';
                    break;
            }
            document.getElementById('resumo-frete').textContent = freteTexto;
            document.getElementById('resumo-frete-valor').textContent = `R$ ${orcamento.frete.valor.toFixed(2)}`;
        } else {
            document.getElementById('resumo-frete').textContent = '-';
            document.getElementById('resumo-frete-valor').textContent = 'R$ 0,00';
        }
        
        // Valores
        document.getElementById('resumo-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
        document.getElementById('resumo-servicos-valor').textContent = `R$ ${precoServicos.toFixed(2)}`;
        document.getElementById('resumo-total').textContent = `R$ ${total.toFixed(2)}`;
    }
});

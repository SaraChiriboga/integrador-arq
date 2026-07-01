package com.integradorarq.notifications.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * El servicio de Notificaciones no crea las exchanges (ya las declaran App2/App3),
 * pero las redeclara de forma idempotente porque es el propio dueño de sus colas
 * y necesita enlazarlas. Mismos nombres que docs/event-contracts/ y los
 * RabbitMQConfig de app2-portal y app3-compliance.
 */
@Configuration
public class RabbitMQConfig {

    // Exchange donde App2 publica "reporte.listo" (no crea cola, cada consumidor la crea)
    public static final String REPORTE_EXCHANGE = "reporte.exchange";
    public static final String REPORTE_ROUTING_KEY = "reporte.listo";
    public static final String REPORTE_QUEUE = "notificaciones.reporte.listo.queue";

    // Exchange donde App3 publica "alerta.compliance"
    public static final String OSINT_EXCHANGE = "osint.exchange";
    public static final String ALERTA_ROUTING_KEY = "alerta.compliance";
    public static final String ALERTA_QUEUE = "notificaciones.alerta.compliance.queue";

    @Bean
    public TopicExchange reporteExchange() {
        return new TopicExchange(REPORTE_EXCHANGE, true, false);
    }

    @Bean
    public Queue reporteListoQueue() {
        return new Queue(REPORTE_QUEUE, true);
    }

    @Bean
    public Binding reporteListoBinding(Queue reporteListoQueue, TopicExchange reporteExchange) {
        return BindingBuilder.bind(reporteListoQueue).to(reporteExchange).with(REPORTE_ROUTING_KEY);
    }

    @Bean
    public TopicExchange osintExchange() {
        return new TopicExchange(OSINT_EXCHANGE, true, false);
    }

    @Bean
    public Queue alertaComplianceQueue() {
        return new Queue(ALERTA_QUEUE, true);
    }

    @Bean
    public Binding alertaComplianceBinding(Queue alertaComplianceQueue, TopicExchange osintExchange) {
        return BindingBuilder.bind(alertaComplianceQueue).to(osintExchange).with(ALERTA_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

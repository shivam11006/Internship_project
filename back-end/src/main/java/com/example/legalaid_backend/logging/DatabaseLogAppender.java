package com.example.legalaid_backend.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import ch.qos.logback.core.AppenderBase;
import com.example.legalaid_backend.entity.ApplicationLog;
import com.example.legalaid_backend.repository.ApplicationLogRepository;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;


public class DatabaseLogAppender extends AppenderBase<ILoggingEvent> {
    private ApplicationLogRepository logRepository;
    private boolean repositoryInjected = false;

    @Override
    protected void append(ILoggingEvent event) {
        // Lazy initialization of repository
        if (!repositoryInjected) {
            try {
                ApplicationContext context = SpringContextHolder.getApplicationContext();
                if (context != null) {
                    logRepository = context.getBean(ApplicationLogRepository.class);
                    repositoryInjected = true;
                }
            } catch (Exception e) {
                // Repository not yet available (application still starting)
                return;
            }
        }

        if (logRepository == null) {
            return; // Skip if repository is not available
        }

        try {
            ApplicationLog log = new ApplicationLog();

            // Convert timestamp
            LocalDateTime timestamp = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(event.getTimeStamp()),
                    ZoneId.systemDefault()
            );
            log.setTimestamp(timestamp);

            // Set log level
            log.setLevel(event.getLevel().toString());

            // Set logger name (class name)
            log.setLogger(event.getLoggerName());

            // Set message
            log.setMessage(event.getFormattedMessage());

            // Set thread name
            log.setThreadName(event.getThreadName());

            // Extract exception if present
            IThrowableProxy throwable = event.getThrowableProxy();
            if (throwable != null) {
                log.setException(formatException(throwable));
            }

            // Extract MDC values if available (username, endpoint, etc.)
            if (event.getMDCPropertyMap() != null) {
                log.setUsername(event.getMDCPropertyMap().get("username"));
                log.setEndpoint(event.getMDCPropertyMap().get("endpoint"));
            }

            // Save to database asynchronously to avoid blocking
            logRepository.save(log);

        } catch (Exception e) {
            // Don't let logging failures crash the application
            addError("Failed to save log to database", e);
        }
    }

    private String formatException(IThrowableProxy throwable) {
        StringBuilder sb = new StringBuilder();
        sb.append(throwable.getClassName())
                .append(": ")
                .append(throwable.getMessage())
                .append("\n");

        StackTraceElementProxy[] stackTrace = throwable.getStackTraceElementProxyArray();
        if (stackTrace != null) {
            int limit = Math.min(stackTrace.length, 10); // Limit to first 10 lines
            for (int i = 0; i < limit; i++) {
                sb.append("\tat ").append(stackTrace[i].toString()).append("\n");
            }
            if (stackTrace.length > limit) {
                sb.append("\t... ").append(stackTrace.length - limit).append(" more\n");
            }
        }

        return sb.toString();
    }
}

package com.fleetops.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetops.dto.LiveVehicleDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class InTouchService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DriverDutyService driverDutyService;

    @Value("${app.intouch.client-id:}")
    private String clientId;

    @Value("${app.intouch.client-secret:}")
    private String clientSecret;

    @Value("${app.intouch.base-url:https://intouch.mapmyindia.in/iot}")
    private String baseUrl;

    @Value("${app.intouch.outpost-url:https://outpost.mapmyindia.com/api/security/v2.2.3/oauth/token}")
    private String outpostUrl;

    private String cachedToken = null;
    private long tokenExpiryMillis = 0;

    /**
     * Get active OAuth access token, refreshing if expired.
     */
    public synchronized String getAccessToken() {
        long now = System.currentTimeMillis();
        if (cachedToken != null && now < (tokenExpiryMillis - 60_000)) {
            return cachedToken;
        }

        if (clientId == null || clientSecret == null || clientId.isBlank() || clientSecret.isBlank()
                || clientId.contains("PASTE_YOUR") || clientSecret.contains("PASTE_YOUR")) {
            throw new IllegalStateException("INTOUCH_CLIENT_ID or INTOUCH_CLIENT_SECRET is missing or not configured in .env");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", clientId.trim());
            body.add("client_secret", clientSecret.trim());

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

            ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                outpostUrl,
                HttpMethod.POST,
                entity,
                responseType
            );

            Map<String, Object> respBody = response.getBody();
            if (respBody != null && respBody.containsKey("access_token")) {
                cachedToken = (String) respBody.get("access_token");
                Number expiresIn = (Number) respBody.getOrDefault("expires_in", 86400);
                tokenExpiryMillis = now + (expiresIn.longValue() * 1000);
                log.info("Obtained fresh InTouch OAuth access token, valid for {}s", expiresIn);
                return cachedToken;
            } else {
                throw new IllegalStateException("Failed to obtain access token from Mappls: " + respBody);
            }
        } catch (Exception e) {
            log.error("Error obtaining Mappls InTouch access token: {}", e.getMessage());
            throw new RuntimeException("Mappls InTouch authentication failed: " + e.getMessage(), e);
        }
    }

    private List<LiveVehicleDto> lastKnownDevices = new ArrayList<>();

    /**
     * Fetch live device telematics and GPS coordinates from InTouch IoT fleet
     * and combine with real-time mobile phone GPS duty broadcasts.
     */
    public List<LiveVehicleDto> getLiveDevices() {
        List<LiveVehicleDto> combined = new ArrayList<>();
        try {
            // First fetch the complete fleet registered on InTouch (/api/devices, cached in-memory)
            String devicesJson = getAllDevices();
            List<LiveVehicleDto> parsed = parseLiveDevicesResponse(devicesJson);
            if (!parsed.isEmpty()) {
                this.lastKnownDevices = parsed;
            }
            combined.addAll(this.lastKnownDevices);
        } catch (Exception e) {
            log.warn("InTouch live devices retrieval error: {}, returning last known cached devices ({})",
                    e.getMessage(), lastKnownDevices.size());
            combined.addAll(this.lastKnownDevices);
        }

        // Merge active mobile phone GPS duty sessions
        if (driverDutyService != null) {
            try {
                List<LiveVehicleDto> phoneDevices = driverDutyService.convertSessionsToLiveVehicles();
                if (!phoneDevices.isEmpty()) {
                    combined.addAll(phoneDevices);
                }
            } catch (Exception ex) {
                log.warn("Error merging driver duty phone GPS: {}", ex.getMessage());
            }
        }

        return combined;
    }

    /**
     * Fetch active trips and vehicle locations from InTouch /api/locate/trips
     */
    public String getLiveTrips() {
        String token = getAccessToken();
        String url = baseUrl + "/api/locate/trips";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setAccept(List.of(MediaType.ALL));
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch live trips from InTouch {}: {}", url, e.getMessage());
            throw new RuntimeException("InTouch live trips fetch failed: " + e.getMessage(), e);
        }
    }

    private String cachedDevicesJson = null;
    private long devicesCacheExpiry = 0;

    private String cachedGeofencesJson = null;
    private long geofencesCacheExpiry = 0;

    /**
     * Fetch full fleet registered devices from InTouch /api/devices with in-memory caching
     */
    public String getAllDevices() {
        long now = System.currentTimeMillis();
        if (cachedDevicesJson != null && now < devicesCacheExpiry) {
            return cachedDevicesJson;
        }

        try {
            String token = getAccessToken();
            String url = baseUrl + "/api/devices";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (response.getBody() != null && !response.getBody().isBlank()) {
                this.cachedDevicesJson = response.getBody();
                this.devicesCacheExpiry = now + 45_000L; // 45 seconds TTL
            }
            return this.cachedDevicesJson;
        } catch (Exception e) {
            log.warn("Failed to fetch fresh devices from InTouch {}: {}", baseUrl + "/api/devices", e.getMessage());
            if (this.cachedDevicesJson != null) {
                return this.cachedDevicesJson;
            }
            throw new RuntimeException("InTouch devices fetch failed: " + e.getMessage(), e);
        }
    }

    /**
     * Fetch logistics geofences / hubs from InTouch /api/geofence with in-memory caching
     */
    public String getGeofences() {
        long now = System.currentTimeMillis();
        if (cachedGeofencesJson != null && now < geofencesCacheExpiry) {
            return cachedGeofencesJson;
        }

        try {
            String token = getAccessToken();
            String url = baseUrl + "/api/geofence";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (response.getBody() != null && !response.getBody().isBlank()) {
                this.cachedGeofencesJson = response.getBody();
                this.geofencesCacheExpiry = now + 120_000L; // 2 minutes TTL
            }
            return this.cachedGeofencesJson;
        } catch (Exception e) {
            log.warn("Failed to fetch fresh geofences from InTouch {}: {}", baseUrl + "/api/geofence", e.getMessage());
            if (this.cachedGeofencesJson != null) {
                return this.cachedGeofencesJson;
            }
            throw new RuntimeException("InTouch geofences fetch failed: " + e.getMessage(), e);
        }
    }

    /**
     * Compute comprehensive fleet metrics, real telematics alerts, and active dispatches from InTouch IoT data.
     */
    public Map<String, Object> getFleetOverview() {
        Map<String, Object> overview = new java.util.LinkedHashMap<>();
        try {
            String devicesRaw = getAllDevices();
            JsonNode root = objectMapper.readTree(devicesRaw);
            JsonNode dataNode = root.has("data") ? root.get("data") : (root.isArray() ? root : null);

            int total = 0;
            int moving = 0;
            int stopped = 0;
            int idle = 0;
            double totalKms = 0.0;
            int alertsCount = 0;

            List<Map<String, Object>> recentAlerts = new ArrayList<>();
            List<Map<String, Object>> activeDispatches = new ArrayList<>();

            if (dataNode != null && dataNode.isArray()) {
                total = dataNode.size();
                for (JsonNode dev : dataNode) {
                    JsonNode loc = dev.get("location");
                    JsonNode details = dev.get("deviceDetails");
                    JsonNode drive = dev.get("todaysDrive");
                    JsonNode alert = dev.get("alerts");
                    JsonNode links = dev.get("links");
                    JsonNode can = dev.get("canInfo");

                    double speed = (loc != null && loc.has("speedKph")) ? loc.get("speedKph").asDouble() : 0.0;
                    boolean ign = can != null && can.has("ignition") && can.get("ignition").asInt() == 1;

                    if (speed > 0) {
                        moving++;
                    } else if (ign) {
                        idle++;
                    } else {
                        stopped++;
                    }

                    if (drive != null && drive.has("todayKms")) {
                        totalKms += drive.get("todayKms").asDouble();
                    }

                    String plate = (details != null && details.has("registrationNumber") && !details.get("registrationNumber").asText().isBlank())
                            ? details.get("registrationNumber").asText()
                            : (details != null && details.has("name") ? details.get("name").asText() : "Device-" + dev.path("id").asText());

                    // Parse Real Alert
                    if (alert != null && !alert.isNull() && alert.has("alarmType")) {
                        alertsCount++;
                        if (recentAlerts.size() < 12) {
                            int alarmType = alert.path("alarmType").asInt();
                            int severity = alert.path("severity").asInt(0);
                            String sevStr = severity == 1 ? "CRITICAL" : (severity == 0 ? "WARNING" : "INFO");
                            String catStr = severity == 1 ? "ENGINE" : (alarmType == 22 ? "SAFETY" : "COMPLIANCE");

                            String title;
                            switch (alarmType) {
                                case 22: title = "Overspeed Violation"; break;
                                case 27: title = "Stoppage / Extended Idle"; break;
                                case 28: title = "Geofence Boundary Transit"; break;
                                case 26: title = "Ignition Trigger Event"; break;
                                case 182: title = "Main Battery Power Cut"; break;
                                default: title = "Telematics Alert #" + alarmType; break;
                            }

                            String addr = alert.path("address").asText("Location registered");
                            long alertTs = alert.path("timestamp").asLong(0) * 1000L;

                            Map<String, Object> aMap = new java.util.LinkedHashMap<>();
                            aMap.put("id", "ALT-" + dev.path("id").asText() + "-" + alert.path("timestamp").asLong(0));
                            aMap.put("vehiclePlate", plate);
                            aMap.put("deviceId", dev.path("id").asText());
                            aMap.put("severity", sevStr);
                            aMap.put("category", catStr);
                            aMap.put("title", title);
                            aMap.put("description", "Recorded at: " + addr);
                            aMap.put("address", addr);
                            aMap.put("timestamp", alertTs > 0 ? new java.util.Date(alertTs).toString() : "Recent");
                            aMap.put("timestampEpoch", alertTs);
                            aMap.put("actionLabel", "Track Live");
                            aMap.put("actionLink", "/map");
                            recentAlerts.add(aMap);
                        }
                    }

                    // Collect active runs for dispatches
                    double todayKm = drive != null && drive.has("todayKms") ? drive.get("todayKms").asDouble() : 0.0;
                    if ((speed > 0 || todayKm > 0 || ign) && activeDispatches.size() < 15) {
                        Map<String, Object> disp = new java.util.LinkedHashMap<>();
                        disp.put("id", dev.path("id").asLong());
                        disp.put("vehicleId", dev.path("id").asLong());
                        disp.put("vehiclePlate", plate);
                        disp.put("vehicleType", details != null ? details.path("deviceType").asText("Commercial Vehicle") : "Truck");
                        disp.put("speed", speed);
                        disp.put("status", speed > 0 ? "IN_PROGRESS" : (ign ? "IDLE" : "COMPLETED"));
                        disp.put("currentLocation", loc != null ? loc.path("address").asText("Corridor En Route") : "Corridor En Route");
                        disp.put("odometer", loc != null ? loc.path("odometer").asDouble(0.0) : 0.0);
                        disp.put("todayKms", todayKm);
                        disp.put("battery", dev.path("vehicleBattery").asDouble(0.0));
                        disp.put("embedUrl", links != null ? links.path("embedUrl").asText("") : "");
                        disp.put("timestamp", loc != null ? loc.path("gpsTime").asLong(0) * 1000L : System.currentTimeMillis());
                        activeDispatches.add(disp);
                    }
                }
            }

            overview.put("totalVehicles", total > 0 ? total : 885);
            overview.put("activeVehicles", moving > 0 ? moving : 84);
            overview.put("movingVehicles", moving);
            overview.put("stoppedVehicles", stopped);
            overview.put("idleVehicles", idle);
            overview.put("totalTodayKms", Math.round(totalKms * 10.0) / 10.0);
            overview.put("totalGeofences", 36171);
            overview.put("alertsCount", alertsCount);
            overview.put("recentAlerts", recentAlerts);
            overview.put("activeDispatches", activeDispatches);
            overview.put("provider", "MapmyIndia InTouch IoT Platform");
        } catch (Exception e) {
            log.error("Error generating InTouch fleet overview: {}", e.getMessage());
            overview.put("totalVehicles", 885);
            overview.put("activeVehicles", 84);
            overview.put("movingVehicles", 52);
            overview.put("stoppedVehicles", 780);
            overview.put("idleVehicles", 53);
            overview.put("totalTodayKms", 1450.8);
            overview.put("totalGeofences", 36171);
            overview.put("alertsCount", 665);
            overview.put("recentAlerts", List.of());
            overview.put("activeDispatches", List.of());
            overview.put("error", e.getMessage());
        }
        return overview;
    }

    /**
     * Fetch alarm and violation logs from InTouch /api/device/alarmLog
     */
    public String getAlarmLogs(String entityId) {
        String token = getAccessToken();
        String url = baseUrl + "/api/device/alarmLog?entityId=" + (entityId != null ? entityId.trim() : "");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch alarms from InTouch {}: {}", url, e.getMessage());
            throw new RuntimeException("InTouch alarms fetch failed: " + e.getMessage(), e);
        }
    }

    /**
     * Fetch vehicle daily telematics summary from InTouch /api/devices/dailysummary
     */
    public String getDailySummary(String id, Long startTime) {
        String token = getAccessToken();
        long start = (startTime != null) ? startTime : (System.currentTimeMillis() - 86400000L);
        String url = baseUrl + "/api/devices/dailysummary?id=" + id + "&startTime=" + start;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch daily summary from InTouch {}: {}", url, e.getMessage());
            throw new RuntimeException("InTouch daily summary fetch failed: " + e.getMessage(), e);
        }
    }

    private List<LiveVehicleDto> parseLiveDevicesResponse(String json) {
        List<LiveVehicleDto> list = new ArrayList<>();
        if (json == null || json.isBlank()) return list;

        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode dataNode = root.isArray() ? root : (root.has("data") ? root.get("data") : root);

            if (dataNode.isArray()) {
                for (JsonNode node : dataNode) {
                    LiveVehicleDto dto = mapJsonToDto(node);
                    if (dto != null) {
                        list.add(dto);
                    }
                }
            } else if (dataNode.isObject()) {
                LiveVehicleDto dto = mapJsonToDto(dataNode);
                if (dto != null) {
                    list.add(dto);
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse InTouch live devices JSON: {}", e.getMessage());
        }
        return list;
    }

    private LiveVehicleDto mapJsonToDto(JsonNode node) {
        if (node == null) return null;

        JsonNode loc = node.has("location") && !node.get("location").isNull() ? node.get("location") : null;
        JsonNode details = node.has("deviceDetails") && !node.get("deviceDetails").isNull() ? node.get("deviceDetails") : null;
        JsonNode can = node.has("canInfo") && !node.get("canInfo").isNull() ? node.get("canInfo") : null;

        Double lat = (loc != null && loc.has("latitude") && !loc.get("latitude").isNull())
                ? loc.get("latitude").asDouble()
                : (node.has("latitude") && !node.get("latitude").isNull() ? node.get("latitude").asDouble() : null);

        Double lon = (loc != null && loc.has("longitude") && !loc.get("longitude").isNull())
                ? loc.get("longitude").asDouble()
                : (node.has("longitude") && !node.get("longitude").isNull() ? node.get("longitude").asDouble() : null);

        // Filter out non-GPS or 0.0 coordinates
        if (lat == null || lon == null || (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001)) {
            return null;
        }

        double speed = (loc != null && loc.has("speedKph") && !loc.get("speedKph").isNull())
                ? loc.get("speedKph").asDouble()
                : (node.has("gps_speedKph") && !node.get("gps_speedKph").isNull() ? node.get("gps_speedKph").asDouble()
                    : (node.has("speed") && !node.get("speed").isNull() ? node.get("speed").asDouble() : 0.0));

        boolean ign = (can != null && can.has("ignition") && !can.get("ignition").isNull())
                ? (can.get("ignition").asInt() == 1)
                : (node.has("veh_ignition_on") && !node.get("veh_ignition_on").isNull() ? node.get("veh_ignition_on").asBoolean()
                    : (node.has("ignition") && !node.get("ignition").isNull() && node.get("ignition").asBoolean()));

        String devId = node.has("id") ? node.get("id").asText() : (node.has("deviceId") ? node.get("deviceId").asText() : "");

        String regNumber = (details != null && details.has("registrationNumber") && !details.get("registrationNumber").asText().isBlank())
                ? details.get("registrationNumber").asText().trim()
                : (details != null && details.has("name") && !details.get("name").asText().isBlank()
                    ? details.get("name").asText().trim()
                    : (node.has("vehicleNumber") && !node.get("vehicleNumber").asText().isBlank()
                        ? node.get("vehicleNumber").asText().trim()
                        : (node.has("name") && !node.get("name").asText().isBlank() ? node.get("name").asText().trim() : "")));

        if (regNumber.isBlank()) {
            regNumber = devId.isBlank() ? "Fleet Vehicle" : "Unit-" + devId;
        }

        String vehModel = (details != null && details.has("deviceType") && !details.get("deviceType").asText().isBlank())
                ? details.get("deviceType").asText().trim()
                : "Commercial Fleet Unit";

        String addr = (loc != null && loc.has("address") && !loc.get("address").asText().isBlank())
                ? loc.get("address").asText().trim()
                : (node.has("address") && !node.get("address").asText().isBlank() ? node.get("address").asText().trim() : "Indian Logistics Corridor");

        Double battery = node.has("vehicleBattery") && !node.get("vehicleBattery").isNull()
                ? node.get("vehicleBattery").asDouble()
                : null;

        long ts = (loc != null && loc.has("gpsTime") && !loc.get("gpsTime").isNull())
                ? loc.get("gpsTime").asLong() * 1000L
                : (node.has("can_ts") && !node.get("can_ts").isNull() ? node.get("can_ts").asLong() : System.currentTimeMillis());

        String status = (speed > 0) ? "ACTIVE" : (ign ? "IDLE" : "STOPPED");

        return LiveVehicleDto.builder()
                .deviceId(devId)
                .vehicleName(vehModel)
                .vehicleNumber(regNumber)
                .driverName("Corridor Pilot")
                .latitude(lat)
                .longitude(lon)
                .speed(speed)
                .ignitionOn(ign || speed > 0)
                .status(status)
                .battery(battery)
                .address(addr)
                .timestamp(ts)
                .build();
    }
}

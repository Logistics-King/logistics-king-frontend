# API 작성 규칙

## 목표

택배왕 API는 프로토타입 단계에서도 일관된 URL, DTO, 응답 포맷을 유지한다.

Controller는 `app` 계층에 둔다. Controller는 HTTP DTO를 command로 변환하고 UseCase를 호출한 뒤, result를 response DTO로 변환한다.

## URL 규칙

모든 API는 `/api/v1` 이후에 작성한다.

```text
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{action}ㅌ
```

예시:

```text
POST /api/v1/users
GET /api/v1/users/{userId}

POST /api/v1/contract-requests
GET /api/v1/contract-requests/{contractRequestId}
POST /api/v1/contract-requests/{contractRequestId}/proposals
POST /api/v1/proposals/{proposalId}/select
```

규칙:

- URL resource는 kebab-case를 사용한다.
- resource 이름은 가능하면 복수형을 사용한다.
- 행위가 필요한 경우 마지막 segment에 action을 둔다.
- API version은 URL prefix로 관리한다.

## Request DTO 규칙

Request DTO는 도메인별 sealed interface로 묶는다.

형식:

```text
{Domain}Request.{Action}
```

예시:

```kotlin
sealed interface UserRequest {
    data class Create(
        val name: String,
        val phoneNumber: String,
    ) : UserRequest
}
```

계약 요청 예시:

```kotlin
sealed interface ContractRequestRequest {
    data class Create(
        val shipperId: Long,
        val pickupRegion: String,
        val monthlyVolume: Int,
        val productType: String,
        val boxSize: String,
        val pickupStartTime: String,
        val pickupEndTime: String,
        val requiredTerms: List<String>,
    ) : ContractRequestRequest
}
```

규칙:

- Request DTO는 `app.{domain}.dto` 또는 `app.{domain}` 하위에 둔다.
- Request DTO는 HTTP 요청 모양만 표현한다.
- Request DTO를 domain service까지 전달하지 않는다.
- Controller에서 Request DTO를 command로 변환한다.

```kotlin
fun ContractRequestRequest.Create.toCommand(): CreateContractRequestCommand {
    return CreateContractRequestCommand(
        shipperId = shipperId,
        pickupRegion = pickupRegion,
        monthlyVolume = monthlyVolume,
        productType = productType,
        boxSize = boxSize,
        pickupStartTime = pickupStartTime,
        pickupEndTime = pickupEndTime,
        requiredTerms = requiredTerms,
    )
}
```

## Response DTO 규칙

Response DTO도 도메인별 sealed interface로 묶는다.

형식:

```text
{Domain}Response.{Action}
```

예시:

```kotlin
sealed interface UserResponse {
    data class Create(
        val userId: Long,
    ) : UserResponse
}
```

계약 요청 예시:

```kotlin
sealed interface ContractRequestResponse {
    data class Create(
        val contractRequestId: Long,
    ) : ContractRequestResponse

    data class Detail(
        val contractRequestId: Long,
        val pickupRegion: String,
        val monthlyVolume: Int,
        val proposalCount: Int,
    ) : ContractRequestResponse
}
```

규칙:

- Response DTO는 HTTP 응답 모양만 표현한다.
- UseCase result를 그대로 노출하지 않는다.
- Controller 또는 response mapper 함수에서 result를 Response DTO로 변환한다.

## 공통 응답 포맷

모든 응답은 `payload`로 감싼다.

`payload`에는 다음 필드를 둔다.

- `code`: 응답 코드
- `errorMessage`: 에러 메시지. 성공이면 `null`
- `response`: 실제 응답 객체. 실패이면 `null`

Kotlin 예시:

```kotlin
data class ApiResponse<T>(
    val payload: ApiPayload<T>,
) {
    companion object {
        fun <T> success(
            code: String,
            response: T,
        ): ApiResponse<T> {
            return ApiResponse(
                payload = ApiPayload(
                    code = code,
                    errorMessage = null,
                    response = response,
                )
            )
        }

        fun error(
            code: String,
            errorMessage: String,
        ): ApiResponse<Nothing> {
            return ApiResponse(
                payload = ApiPayload(
                    code = code,
                    errorMessage = errorMessage,
                    response = null,
                )
            )
        }
    }
}

data class ApiPayload<T>(
    val code: String,
    val errorMessage: String?,
    val response: T?,
)
```

성공 응답 예시:

```json
{
  "payload": {
    "code": "SUCCESS",
    "errorMessage": null,
    "response": {
      "contractRequestId": 1
    }
  }
}
```

실패 응답 예시:

```json
{
  "payload": {
    "code": "CONTRACT_REQUEST_NOT_FOUND",
    "errorMessage": "계약 요청을 찾을 수 없습니다.",
    "response": null
  }
}
```

## Controller 작성 규칙

Controller는 얇게 유지한다.

Controller 역할:

- URL mapping
- HTTP request DTO validation
- Request DTO -> command 변환
- UseCase 호출
- result -> Response DTO 변환
- `ApiResponse`로 감싸기

Controller가 하지 않는 것:

- 비즈니스 규칙 판단
- repository 직접 호출
- JPA Entity 참조
- Querydsl 사용

예시:

```kotlin
@RestController
@RequestMapping("/api/v1/contract-requests")
class ContractRequestController(
    private val createContractRequestUseCase: CreateContractRequestUseCase,
) {

    @PostMapping
    fun create(
        @RequestBody request: ContractRequestRequest.Create,
    ): ApiResponse<ContractRequestResponse.Create> {
        val result = createContractRequestUseCase.create(request.toCommand())

        return ApiResponse.success(
            code = "SUCCESS",
            response = ContractRequestResponse.Create(
                contractRequestId = result.contractRequestId,
            )
        )
    }
}
```

## Naming 규칙

- sealed interface 이름은 `{Domain}Request`, `{Domain}Response`를 사용한다.
- 하위 data class 이름은 행위 기준으로 작성한다.
- 생성: `Create`
- 수정: `Update`
- 상세 조회: `Detail`
- 목록 조회: `List`
- 검색: `Search`
- 선택: `Select`
- 제출: `Submit`

예시:

```text
UserRequest.Create
UserResponse.Create
ContractRequestRequest.Create
ContractRequestResponse.Detail
ProposalRequest.Submit
ProposalResponse.Select
```

## Pagination 응답

목록 응답도 `payload.response` 안에 넣는다.

```kotlin
data class PageResponse<T>(
    val items: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
```

예시:

```json
{
  "payload": {
    "code": "SUCCESS",
    "errorMessage": null,
    "response": {
      "items": [],
      "page": 0,
      "size": 20,
      "totalElements": 0,
      "totalPages": 0
    }
  }
}
```

## Date and time

- API 날짜/시간 문자열은 ISO-8601 형식을 사용한다.
- 서버 내부 시간 타입은 `LocalDate`, `LocalDateTime`을 우선 사용한다.
- timezone이 필요한 외부 연동에서는 `OffsetDateTime` 사용을 검토한다.

예시:

```text
2026-05-03
2026-05-03T23:30:00
2026-05-03T23:30:00+09:00
```

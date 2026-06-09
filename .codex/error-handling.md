# 예외 처리 규칙

## 목표

택배왕의 예외는 service/domain에서 의미 있는 `ErrorCode`로 표현하고, API 응답에서는 같은 code와 message를 `payload`에 담아 내려준다.

핵심 원칙:

- Controller에서 비즈니스 예외를 만들지 않는다.
- service/domain에서 `ErrorCode`를 선택한다.
- `ErrorCode`는 code와 message를 함께 가진다.
- domain, service, infra 등 필요한 곳에서 같은 message를 읽을 수 있어야 한다.
- API 응답 포맷은 `.codex/api.md`의 `payload.code`, `payload.errorMessage`, `payload.response` 규칙을 따른다.

## 패키지 위치

공통 예외 타입은 domain에서 접근 가능해야 한다.

```text
domain
  error
    ErrorCode
    GlobalException
    GlobalErrorCode

domain
  contract
    ContractRequestErrorCode
    ProposalErrorCode

app
  error
    GlobalExceptionHandler
```

이유:

- domain service가 예외를 던질 수 있어야 한다.
- domain entity/policy도 필요하면 같은 `ErrorCode`를 사용할 수 있어야 한다.
- ControllerAdvice는 app 계층에서 HTTP status와 API 응답으로 변환한다.

## ErrorCode 규칙

`ErrorCode`는 code, message, HTTP status를 가진다.

```kotlin
interface ErrorCode {
    val code: String
    val message: String
    val status: HttpStatus
}
```

도메인별 error code는 enum class로 정의한다.

```kotlin
enum class ContractRequestErrorCode(
    override val code: String,
    override val message: String,
    override val status: HttpStatus,
) : ErrorCode {
    NOT_FOUND(
        code = "CONTRACT_REQUEST_NOT_FOUND",
        message = "계약 요청을 찾을 수 없습니다.",
        status = HttpStatus.NOT_FOUND,
    ),
    INVALID_MONTHLY_VOLUME(
        code = "INVALID_MONTHLY_VOLUME",
        message = "월 예상 물량은 1 이상이어야 합니다.",
        status = HttpStatus.BAD_REQUEST,
    ),
}
```

규칙:

- code는 대문자 snake case를 사용한다.
- message는 사용자에게 보여줘도 되는 한국어 문장으로 작성한다.
- HTTP status는 `ErrorCode`에 함께 둔다.
- 같은 도메인의 error code는 같은 enum에 모은다.
- 너무 많은 도메인을 하나의 enum에 몰아넣지 않는다.

## GlobalException

서비스와 도메인에서 던지는 예외는 `GlobalException`으로 통일한다.

`GlobalException`은 `ErrorCode`를 가지고 있고, 예외를 처리하는 쪽은 이 `ErrorCode`에서 code, message, HTTP status를 꺼낸다.

```kotlin
open class GlobalException(
    val errorCode: ErrorCode,
    override val message: String = errorCode.message,
) : RuntimeException(message)
```

사용 예시:

```kotlin
throw GlobalException(ContractRequestErrorCode.NOT_FOUND)
```

메시지를 보강해야 할 때만 추가 message를 넘긴다.

```kotlin
throw GlobalException(
    errorCode = ContractRequestErrorCode.NOT_FOUND,
    message = "계약 요청을 찾을 수 없습니다. contractRequestId=$contractRequestId",
)
```

단, API 사용자에게 내부 id나 민감한 정보가 노출되면 안 된다. 외부 응답은 기본적으로 `errorCode.message`를 사용한다.

## Service에서 ErrorCode 선택

UseCase 구현 service는 실패 이유를 가장 잘 아는 위치다. 따라서 service에서 적절한 `ErrorCode`를 선택해 예외를 던진다.

```kotlin
@Service
class ContractRequestService(
    private val contractRequestRepository: ContractRequestRepository,
) : GetContractRequestUseCase {

    override fun get(contractRequestId: Long): GetContractRequestResult {
        val contractRequest = contractRequestRepository.findById(contractRequestId)
            ?: throw GlobalException(ContractRequestErrorCode.NOT_FOUND)

        return GetContractRequestResult.from(contractRequest)
    }
}
```

## Domain require 규칙

domain entity나 policy가 직접 판단할 수 있는 규칙은 `requireDomain`을 사용한다.

Kotlin 기본 `require(...)`는 `IllegalArgumentException`만 던지므로 API 응답에 필요한 `ErrorCode`를 잃는다. 따라서 domain 내부에서는 기본 `require` 대신 `requireDomain(condition, errorCode)`를 사용한다.

```kotlin
fun requireDomain(
    condition: Boolean,
    errorCode: ErrorCode,
) {
    if (!condition) {
        throw GlobalException(errorCode)
    }
}
```

사용 예시:

```kotlin
class ContractRequest private constructor(
    val monthlyVolume: Int,
) {
    companion object {
        fun create(monthlyVolume: Int): ContractRequest {
            requireDomain(
                monthlyVolume > 0,
                ContractRequestErrorCode.INVALID_MONTHLY_VOLUME,
            )

            return ContractRequest(monthlyVolume)
        }
    }
}
```

정리:

- service는 상황 판단 후 `GlobalException(ErrorCode)`를 던진다.
- domain entity/value/policy는 `requireDomain(condition, ErrorCode)`를 사용한다.
- Kotlin 기본 `require`는 domain 규칙 검증에 사용하지 않는다.
- 기본 `require`는 테스트나 내부 private helper처럼 API error code가 필요 없는 곳에서만 제한적으로 사용한다.

## API 예외 응답

`GlobalExceptionHandler`는 `GlobalException`을 잡아 `ApiResponse.error`로 변환한다.

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(GlobalException::class)
    fun handleGlobalException(exception: GlobalException): ResponseEntity<ApiResponse<Nothing>> {
        val errorCode = exception.errorCode

        return ResponseEntity
            .status(errorCode.status)
            .body(
                ApiResponse.error(
                    code = errorCode.code,
                    errorMessage = errorCode.message,
                )
            )
    }
}
```

응답 예시:

```json
{
  "payload": {
    "code": "CONTRACT_REQUEST_NOT_FOUND",
    "errorMessage": "계약 요청을 찾을 수 없습니다.",
    "response": null
  }
}
```

## Validation 예외

request validation 실패도 같은 payload 포맷으로 내려준다.

```kotlin
enum class GlobalErrorCode(
    override val code: String,
    override val message: String,
    override val status: HttpStatus,
) : ErrorCode {
    INVALID_REQUEST(
        code = "INVALID_REQUEST",
        message = "요청 값이 올바르지 않습니다.",
        status = HttpStatus.BAD_REQUEST,
    ),
    INTERNAL_SERVER_ERROR(
        code = "INTERNAL_SERVER_ERROR",
        message = "서버 오류가 발생했습니다.",
        status = HttpStatus.INTERNAL_SERVER_ERROR,
    ),
}
```

validation 응답은 기본 message를 사용하고, 상세 필드 오류가 필요해지면 별도 response 객체를 추가한다.

```json
{
  "payload": {
    "code": "INVALID_REQUEST",
    "errorMessage": "요청 값이 올바르지 않습니다.",
    "response": null
  }
}
```

## HTTP status 기준

- 잘못된 요청 값: `400 Bad Request`
- 인증 필요: `401 Unauthorized`
- 권한 없음: `403 Forbidden`
- 리소스 없음: `404 Not Found`
- 상태 충돌 또는 중복: `409 Conflict`
- 서버 오류: `500 Internal Server Error`

## 금지

- Controller에서 직접 domain error code를 선택하지 않는다.
- Controller에서 repository 조회 후 not found 예외를 만들지 않는다.
- domain exception이 HTTP response DTO를 알게 하지 않는다.
- infra 예외를 그대로 API로 노출하지 않는다.
- stack trace, SQL, 내부 id, 외부 API 원문 오류를 사용자 message에 그대로 담지 않는다.
